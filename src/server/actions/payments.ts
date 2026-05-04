"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import {
  cashPaymentSchema,
  initCheckoutSchema,
} from "@/lib/validations/payment";
import type { PaymentGateway, PaymentStatus } from "@/lib/validations/payment";
import { logAudit } from "../audit";
import { trackEvent } from "@/lib/analytics";
import { getPreferenceClient, isMpConfigured } from "@/lib/payments/mp-client";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  paidAt: Date | null;
  createdAt: Date;
  membershipId: string | null;
  athleteName: string | null;
  planName: string | null;
};

export async function listPayments(opts?: {
  status?: PaymentStatus;
  gateway?: PaymentGateway;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}): Promise<PaymentRow[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const payments = await db.payment.findMany({
    where: {
      ...(opts?.status ? { status: opts.status } : {}),
      ...(opts?.gateway ? { gateway: opts.gateway } : {}),
      ...(opts?.fromDate || opts?.toDate
        ? {
            createdAt: {
              ...(opts.fromDate ? { gte: opts.fromDate } : {}),
              ...(opts.toDate ? { lte: opts.toDate } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 100,
    include: {
      membership: {
        include: {
          athlete: { select: { firstName: true, lastName: true } },
          plan: { select: { name: true } },
        },
      },
    },
  });

  return payments.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    currency: p.currency,
    gateway: p.gateway as PaymentGateway,
    status: p.status as PaymentStatus,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
    membershipId: p.membershipId,
    athleteName: p.membership
      ? `${p.membership.athlete.firstName} ${p.membership.athlete.lastName}`
      : null,
    planName: p.membership?.plan.name ?? null,
  }));
}

export type PaymentStats = {
  monthRevenue: number;
  monthCount: number;
  pendingRevenue: number;
  pendingCount: number;
};

export async function getPaymentStats(): Promise<PaymentStats> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [paidThisMonth, pending] = await Promise.all([
    db.payment.findMany({
      where: { status: "PAID", paidAt: { gte: monthStart } },
      select: { amount: true },
    }),
    db.payment.findMany({
      where: { status: "PENDING" },
      select: { amount: true },
    }),
  ]);

  return {
    monthRevenue: paidThisMonth.reduce((acc, p) => acc + Number(p.amount), 0),
    monthCount: paidThisMonth.length,
    pendingRevenue: pending.reduce((acc, p) => acc + Number(p.amount), 0),
    pendingCount: pending.length,
  };
}

export async function registerCashPayment(data: unknown) {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const parsed = cashPaymentSchema.parse(data);
  const db = withTenant(tenantId);

  // Verify membership belongs to this tenant
  const membership = await db.membership.findUnique({
    where: { id: parsed.membershipId },
  });
  if (!membership) throw new Error("Membership no encontrada");

  const created = await rawDb.payment.create({
    data: {
      tenantId,
      membershipId: parsed.membershipId,
      amount: parsed.amount,
      currency: parsed.currency,
      gateway: "CASH",
      status: "PAID",
      paidAt: parsed.paidAt,
    },
  });

  await logAudit({
    tenantId,
    actorId: session.user.id,
    action: "PAYMENT_REGISTERED",
    targetType: "Payment",
    targetId: created.id,
    metadata: {
      membershipId: parsed.membershipId,
      amount: parsed.amount,
      currency: parsed.currency,
      gateway: "CASH",
    },
  });

  await trackEvent("payment_registered", {
    tenantId,
    actorId: session.user.id,
    paymentId: created.id,
    amount: parsed.amount,
    currency: parsed.currency,
    gateway: "CASH",
  });

  revalidatePath("/admin/pagos");
  return { ok: true };
}

export type InitCheckoutResult = {
  paymentId: string;
  initPoint: string;
  sandboxInitPoint: string;
};

/**
 * Inicia un checkout de MercadoPago para un Membership PENDING.
 * Idempotente: si ya hay Payment PENDING con mpPreferenceId, lo reutiliza.
 *
 * Auth: el atleta dueño del Membership (session.user.id == athlete.userId).
 */
export async function initMpCheckout(
  input: unknown,
): Promise<InitCheckoutResult> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const parsed = initCheckoutSchema.parse(input);

  if (!isMpConfigured()) {
    throw new Error(
      "MercadoPago no está configurado en este servidor (falta MERCADOPAGO_ACCESS_TOKEN).",
    );
  }

  const db = withTenant(tenantId);

  // Membership belongs to tenant + check ownership when atleta
  const membership = await db.membership.findUnique({
    where: { id: parsed.membershipId },
    include: {
      athlete: {
        select: { id: true, userId: true, firstName: true, lastName: true },
      },
      plan: { select: { name: true, price: true, currency: true } },
    },
  });
  if (!membership) throw new Error("Membership no encontrada");

  const box = await db.box.findUnique({
    where: { id: tenantId },
    select: { name: true, currency: true },
  });
  if (!box) throw new Error("Box no encontrado");

  // Atleta solo puede pagar SU membership. OWNER/COACH pueden iniciar por cualquiera del box.
  if (
    session.user.role === "ATHLETE" &&
    membership.athlete.userId !== session.user.id
  ) {
    throw new Error("Forbidden");
  }

  // Reuse existing PENDING payment with preference if present
  const existing = await db.payment.findFirst({
    where: {
      membershipId: membership.id,
      gateway: "MERCADOPAGO",
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
  });

  let payment = existing;
  if (!payment) {
    payment = await rawDb.payment.create({
      data: {
        tenantId,
        membershipId: membership.id,
        amount: membership.plan.price,
        currency: box.currency,
        gateway: "MERCADOPAGO",
        status: "PENDING",
      },
    });
  }

  const baseUrl = process.env.MP_BACK_URL_BASE ?? "http://localhost:3000";
  const isHttps = baseUrl.startsWith("https://");

  // If we already have a preference for this payment AND the back URL didn't change, reuse it.
  if (payment.mpPreferenceId) {
    const sandboxInit = `https://sandbox.mercadopago.com.mx/checkout/v1/redirect?pref_id=${payment.mpPreferenceId}`;
    const init = `https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=${payment.mpPreferenceId}`;
    return {
      paymentId: payment.id,
      initPoint: init,
      sandboxInitPoint: sandboxInit,
    };
  }

  const preferenceClient = getPreferenceClient();
  const preference = await preferenceClient.create({
    body: {
      external_reference: payment.id,
      items: [
        {
          id: membership.planId,
          title: `${membership.plan.name} — ${box.name}`,
          description: `Membresía CrossFit (${membership.athlete.firstName} ${membership.athlete.lastName})`,
          quantity: 1,
          unit_price: Number(membership.plan.price),
          currency_id: box.currency,
        },
      ],
      back_urls: {
        success: `${baseUrl}/atleta/pagos/${payment.id}/resultado?status=success`,
        failure: `${baseUrl}/atleta/pagos/${payment.id}/resultado?status=failure`,
        pending: `${baseUrl}/atleta/pagos/${payment.id}/resultado?status=pending`,
      },
      ...(isHttps ? { auto_return: "approved" } : {}),
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      metadata: {
        tenantId,
        membershipId: membership.id,
        athleteId: membership.athleteId,
      },
    },
  });

  if (!preference.id || !preference.init_point) {
    throw new Error("Mercado Pago no devolvió una preference válida");
  }

  await rawDb.payment.update({
    where: { id: payment.id },
    data: { mpPreferenceId: preference.id },
  });

  await logAudit({
    tenantId,
    actorId: session.user.id,
    action: "PAYMENT_INITIATED",
    targetType: "Payment",
    targetId: payment.id,
    metadata: {
      membershipId: membership.id,
      gateway: "MERCADOPAGO",
      mpPreferenceId: preference.id,
      amount: Number(membership.plan.price),
      currency: box.currency,
    },
  });

  return {
    paymentId: payment.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point ?? preference.init_point,
  };
}

export async function getPaymentStatus(paymentId: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      membership: { select: { athlete: { select: { userId: true } } } },
    },
  });
  if (!payment) return null;
  if (
    session.user.role === "ATHLETE" &&
    payment.membership?.athlete?.userId !== session.user.id
  ) {
    return null;
  }
  return {
    id: payment.id,
    status: payment.status,
    paidAt: payment.paidAt,
    amount: Number(payment.amount),
    currency: payment.currency,
    gateway: payment.gateway,
    mpStatus: payment.mpStatus,
    mpStatusDetail: payment.mpStatusDetail,
  };
}

export async function listAthleteMemberships() {
  const session = await requireSession();
  if (session.user.role !== "ATHLETE") {
    throw new Error("Solo atletas");
  }
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const athlete = await db.athlete.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return [];

  const memberships = await db.membership.findMany({
    where: { athleteId: athlete.id },
    orderBy: { createdAt: "desc" },
    include: {
      plan: { select: { name: true, price: true, currency: true, type: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          currency: true,
          gateway: true,
          status: true,
          paidAt: true,
          createdAt: true,
        },
      },
    },
  });

  return memberships.map((m) => {
    const pendingMpPayment = m.payments.find(
      (p) => p.gateway === "MERCADOPAGO" && p.status === "PENDING",
    );
    return {
      id: m.id,
      status: m.status,
      startDate: m.startDate,
      endDate: m.endDate,
      autoRenew: m.autoRenew,
      planName: m.plan.name,
      planType: m.plan.type,
      planPrice: Number(m.plan.price),
      planCurrency: m.plan.currency,
      pendingPaymentId: pendingMpPayment?.id ?? null,
      payments: m.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        currency: p.currency,
        gateway: p.gateway,
        status: p.status,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      })),
    };
  });
}

export async function voidPayment(id: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  await db.payment.update({
    where: { id },
    data: { status: "REFUNDED" },
  });

  await logAudit({
    tenantId: session.user.tenantId,
    actorId: session.user.id,
    action: "PAYMENT_VOIDED",
    targetType: "Payment",
    targetId: id,
  });

  revalidatePath("/admin/pagos");
  return { ok: true };
}
