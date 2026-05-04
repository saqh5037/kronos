"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { cashPaymentSchema } from "@/lib/validations/payment";
import type { PaymentGateway, PaymentStatus } from "@/lib/validations/payment";
import { logAudit } from "../audit";
import { trackEvent } from "@/lib/analytics";

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
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}): Promise<PaymentRow[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const payments = await db.payment.findMany({
    where: {
      ...(opts?.status ? { status: opts.status } : {}),
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
