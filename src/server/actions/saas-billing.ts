"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { db as prismaBase } from "../db";
import { logAudit } from "../audit";
import {
  isMockMode,
  nextBillingDate,
  type SaasPlanFeatures,
} from "@/lib/saas-billing";
import { isMpConfigured, getPreferenceClient } from "@/lib/payments/mp-client";

async function requireOwner(): Promise<{ tenantId: string; actorId: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.id) {
    throw new Error("Unauthorized");
  }
  if (session.user.role !== "OWNER") {
    throw new Error("Forbidden: solo OWNER puede gestionar suscripción");
  }
  return { tenantId: session.user.tenantId, actorId: session.user.id };
}

export type SaasPlanRow = {
  id: string;
  slug: string;
  name: string;
  priceMxnCents: number;
  maxAthletes: number | null;
  maxCoaches: number | null;
  features: SaasPlanFeatures;
  sortOrder: number;
};

export async function listSaasPlans(): Promise<SaasPlanRow[]> {
  const plans = await prismaBase.saasPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      priceMxnCents: true,
      maxAthletes: true,
      maxCoaches: true,
      features: true,
      sortOrder: true,
    },
  });
  return plans.map((p) => ({
    ...p,
    features: p.features as unknown as SaasPlanFeatures,
  }));
}

export type CurrentSubscription = {
  id: string;
  status: "PENDING" | "ACTIVE" | "CANCELLED" | "EXPIRED";
  startsAt: Date | null;
  currentPeriodEnd: Date | null;
  plan: { name: string; slug: string; priceMxnCents: number };
};

export async function getCurrentSubscription(): Promise<CurrentSubscription | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return null;

  const sub = await prismaBase.saasSubscription.findFirst({
    where: { tenantId: session.user.tenantId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      startsAt: true,
      currentPeriodEnd: true,
      plan: { select: { name: true, slug: true, priceMxnCents: true } },
    },
  });
  if (!sub) return null;
  return {
    id: sub.id,
    status: sub.status as CurrentSubscription["status"],
    startsAt: sub.startsAt,
    currentPeriodEnd: sub.currentPeriodEnd,
    plan: sub.plan,
  };
}

export type CreateCheckoutResult =
  | {
      ok: true;
      subscriptionId: string;
      mode: "real" | "mock";
      initPoint?: string;
      sandboxInitPoint?: string;
    }
  | { ok: false; message: string };

export async function createSaasCheckout(
  planSlug: string,
): Promise<CreateCheckoutResult> {
  const { tenantId, actorId } = await requireOwner();

  const plan = await prismaBase.saasPlan.findUnique({
    where: { slug: planSlug },
    select: { id: true, slug: true, name: true, priceMxnCents: true },
  });
  if (!plan) return { ok: false, message: "Plan no encontrado" };

  if (plan.priceMxnCents === 0) {
    return {
      ok: false,
      message:
        "El plan Free no requiere checkout. Está activo automáticamente.",
    };
  }

  const box = await prismaBase.box.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });
  if (!box) return { ok: false, message: "Box no encontrado" };

  const subscription = await prismaBase.saasSubscription.create({
    data: {
      tenantId,
      planId: plan.id,
      status: "PENDING",
    },
    select: { id: true },
  });

  await logAudit({
    tenantId,
    actorId,
    action: "PAYMENT_INITIATED",
    targetType: "SaasSubscription",
    targetId: subscription.id,
    metadata: {
      kind: "SAAS_CHECKOUT_INITIATED",
      planSlug: plan.slug,
      mode: isMpConfigured() ? "real" : "mock",
    },
  });

  if (!isMpConfigured() || isMockMode()) {
    return {
      ok: true,
      subscriptionId: subscription.id,
      mode: "mock",
    };
  }

  const baseUrl = process.env.MP_BACK_URL_BASE ?? "http://localhost:3000";
  const isHttps = baseUrl.startsWith("https://");
  const preferenceClient = getPreferenceClient();
  const preference = await preferenceClient.create({
    body: {
      external_reference: subscription.id,
      items: [
        {
          id: plan.id,
          title: `Kronos ${plan.name} — ${box.name}`,
          description: `Suscripción mensual a Kronos plan ${plan.name}`,
          quantity: 1,
          unit_price: plan.priceMxnCents / 100,
          currency_id: "MXN",
        },
      ],
      back_urls: {
        success: `${baseUrl}/admin/billing?status=success`,
        failure: `${baseUrl}/admin/billing?status=failure`,
        pending: `${baseUrl}/admin/billing?status=pending`,
      },
      ...(isHttps ? { auto_return: "approved" } : {}),
      notification_url: `${baseUrl}/api/webhooks/mp-saas`,
      metadata: {
        tenantId,
        subscriptionId: subscription.id,
        planSlug: plan.slug,
      },
    },
  });

  if (!preference.id || !preference.init_point) {
    return {
      ok: false,
      message: "MercadoPago no devolvió una preference válida",
    };
  }

  await prismaBase.saasSubscription.update({
    where: { id: subscription.id },
    data: { mpPreferenceId: preference.id },
  });

  return {
    ok: true,
    subscriptionId: subscription.id,
    mode: "real",
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point ?? undefined,
  };
}

export async function confirmCheckoutMock(
  subscriptionId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { tenantId, actorId } = await requireOwner();

  if (!isMockMode()) {
    return {
      ok: false,
      message: "Mock confirm solo disponible cuando MP no está configurado",
    };
  }

  const sub = await prismaBase.saasSubscription.findUnique({
    where: { id: subscriptionId },
    select: {
      tenantId: true,
      status: true,
      planId: true,
      plan: { select: { priceMxnCents: true } },
    },
  });
  if (!sub || sub.tenantId !== tenantId) {
    return { ok: false, message: "Suscripción no encontrada" };
  }
  if (sub.status === "ACTIVE") {
    return { ok: true };
  }
  if (sub.status !== "PENDING") {
    return {
      ok: false,
      message: `No se puede confirmar suscripción con estado ${sub.status}`,
    };
  }

  const startsAt = new Date();
  const currentPeriodEnd = nextBillingDate(startsAt);

  await prismaBase.$transaction([
    prismaBase.saasSubscription.update({
      where: { id: subscriptionId },
      data: { status: "ACTIVE", startsAt, currentPeriodEnd },
    }),
    prismaBase.box.update({
      where: { id: tenantId },
      data: { subscriptionStatus: "ACTIVE", trialEndsAt: currentPeriodEnd },
    }),
    prismaBase.saasInvoice.create({
      data: {
        tenantId,
        subscriptionId,
        amountMxnCents: sub.plan.priceMxnCents,
        status: "PAID",
        periodStart: startsAt,
        periodEnd: currentPeriodEnd,
        paidAt: startsAt,
      },
    }),
  ]);

  await logAudit({
    tenantId,
    actorId,
    action: "PAYMENT_CONFIRMED",
    targetType: "SaasSubscription",
    targetId: subscriptionId,
    metadata: { kind: "SAAS_CHECKOUT_CONFIRMED_MOCK" },
  });

  revalidatePath("/admin/billing");
  revalidatePath("/admin");
  return { ok: true };
}

export type SaasInvoiceRow = {
  id: string;
  paidAt: Date;
  planName: string;
  planSlug: string;
  amountMxnCents: number;
  periodStart: Date;
  periodEnd: Date;
  status: "PAID" | "REFUNDED";
};

export type SaasInvoiceFilters = {
  from?: Date;
  to?: Date;
  planSlug?: string;
};

export async function listSaasInvoices(
  filters?: SaasInvoiceFilters,
): Promise<SaasInvoiceRow[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  if (session.user.role !== "OWNER") throw new Error("Forbidden");

  const paidAtFilter: { gte?: Date; lte?: Date } = {};
  if (filters?.from) paidAtFilter.gte = filters.from;
  if (filters?.to) paidAtFilter.lte = filters.to;

  const rows = await prismaBase.saasInvoice.findMany({
    where: {
      tenantId: session.user.tenantId,
      ...(paidAtFilter.gte || paidAtFilter.lte ? { paidAt: paidAtFilter } : {}),
      ...(filters?.planSlug
        ? { subscription: { plan: { slug: filters.planSlug } } }
        : {}),
    },
    orderBy: { paidAt: "desc" },
    select: {
      id: true,
      paidAt: true,
      amountMxnCents: true,
      periodStart: true,
      periodEnd: true,
      status: true,
      subscription: {
        select: { plan: { select: { name: true, slug: true } } },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    paidAt: r.paidAt,
    planName: r.subscription.plan.name,
    planSlug: r.subscription.plan.slug,
    amountMxnCents: r.amountMxnCents,
    periodStart: r.periodStart,
    periodEnd: r.periodEnd,
    status: r.status as "PAID" | "REFUNDED",
  }));
}

export async function exportSaasInvoicesCsv(
  filters?: SaasInvoiceFilters,
): Promise<string> {
  const { invoicesToCsv } = await import("@/lib/saas-invoices-csv");
  const rows = await listSaasInvoices(filters);
  return invoicesToCsv(
    rows.map((r) => ({
      id: r.id,
      paidAt: r.paidAt,
      planName: r.planName,
      amountMxnCents: r.amountMxnCents,
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      status: r.status,
    })),
  );
}

export async function cancelSaasSubscription(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const { tenantId, actorId } = await requireOwner();

  const sub = await prismaBase.saasSubscription.findFirst({
    where: { tenantId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!sub) {
    return { ok: false, message: "No hay suscripción activa" };
  }

  await prismaBase.saasSubscription.update({
    where: { id: sub.id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  await logAudit({
    tenantId,
    actorId,
    action: "MEMBERSHIP_CANCELLED",
    targetType: "SaasSubscription",
    targetId: sub.id,
    metadata: { kind: "SAAS_SUBSCRIPTION_CANCELLED" },
  });

  revalidatePath("/admin/billing");
  return { ok: true };
}
