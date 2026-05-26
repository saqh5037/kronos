"use server";

import { revalidatePath } from "next/cache";
import { db as prismaBase } from "@/server/db";
import { requireSuperAdmin } from "@/server/super-admin-guard";
import { logAudit } from "@/server/audit";
import { computeArrProjectedCents } from "@/server/saas-billing/metrics";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import {
  computeBillingPeriod,
  validatePeriodMonths,
  validateTrialDays,
} from "@/server/saas-billing/billing-period";

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function getSuperActorId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlatformBillingKpis = {
  mrrTotalCents: number;
  arrProjectedCents: number;
  ltvAvgCents: number;
  countActive: number;
  countTrial: number;
  countPastDue: number;
  countCancelled: number;
  countExpired: number;
};

export type SubscriptionRow = {
  id: string;
  boxId: string;
  boxName: string;
  boxSlug: string;
  planId: string;
  planName: string;
  planSlug: string;
  mrrCents: number;
  status: string;
  startsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelledAt: Date | null;
};

export type SubscriptionListResult = {
  rows: SubscriptionRow[];
  total: number;
};

export type CrossTenantInvoiceRow = {
  id: string;
  boxId: string;
  boxName: string;
  planName: string;
  amountMxnCents: number;
  status: "PAID" | "REFUNDED";
  paidAt: Date;
  periodStart: Date;
  periodEnd: Date;
};

export type InvoiceListResult = {
  rows: CrossTenantInvoiceRow[];
  total: number;
};

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Global SaaS KPIs across all tenants.
 * MRR = sum of active subscription plan prices.
 * LTV avg = lifetime spend per box with at least one paid invoice.
 */
export async function getPlatformBillingKpis(): Promise<PlatformBillingKpis> {
  const gate = await requireSuperAdmin();
  if (gate !== true) {
    return {
      mrrTotalCents: 0,
      arrProjectedCents: 0,
      ltvAvgCents: 0,
      countActive: 0,
      countTrial: 0,
      countPastDue: 0,
      countCancelled: 0,
      countExpired: 0,
    };
  }

  const [activeSubs, statusGroups, allInvoices] = await Promise.all([
    prismaBase.saasSubscription.findMany({
      where: { status: "ACTIVE" },
      select: {
        plan: { select: { priceMxnCents: true } },
      },
    }),
    prismaBase.box.groupBy({
      by: ["subscriptionStatus"],
      _count: { _all: true },
    }),
    prismaBase.saasInvoice.findMany({
      select: {
        tenantId: true,
        amountMxnCents: true,
        status: true,
        paidAt: true,
      },
    }),
  ]);

  // TODO(W-5): guard against multiple ACTIVE subs per tenant — currently MRR inflates if a tenant has >1 ACTIVE sub
  const mrrTotalCents = activeSubs.reduce(
    (sum, s) => sum + s.plan.priceMxnCents,
    0,
  );
  const arrProjectedCents = computeArrProjectedCents(mrrTotalCents);

  // LTV per box: group paid invoices by tenantId, then average
  const ltvByTenant = new Map<string, number>();
  for (const inv of allInvoices) {
    if (inv.status !== "PAID") continue;
    ltvByTenant.set(
      inv.tenantId,
      (ltvByTenant.get(inv.tenantId) ?? 0) + inv.amountMxnCents,
    );
  }
  const ltvValues = Array.from(ltvByTenant.values());
  const ltvAvgCents =
    ltvValues.length > 0
      ? Math.round(ltvValues.reduce((a, b) => a + b, 0) / ltvValues.length)
      : 0;

  const byStatus = statusGroups.reduce<Record<string, number>>((acc, row) => {
    acc[row.subscriptionStatus] = row._count._all;
    return acc;
  }, {});

  return {
    mrrTotalCents,
    arrProjectedCents,
    ltvAvgCents,
    countActive: byStatus["ACTIVE"] ?? 0,
    countTrial: byStatus["TRIAL"] ?? 0,
    countPastDue: byStatus["PAST_DUE"] ?? 0,
    countCancelled: byStatus["CANCELLED"] ?? 0,
    countExpired: byStatus["EXPIRED"] ?? 0,
  };
}

export type SubscriptionFilters = {
  page?: number;
  pageSize?: number;
  status?: string;
  planId?: string;
  q?: string; // search by box name
};

/**
 * All subscriptions across all tenants, with box + plan info.
 */
export async function listAllSubscriptionsCrossTenant(
  opts: SubscriptionFilters = {},
): Promise<SubscriptionListResult> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return { rows: [], total: 0 };

  const pageSize = opts.pageSize ?? 10;
  const page = opts.page ?? 1;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(opts.status
      ? {
          status: opts.status as
            | "PENDING"
            | "ACTIVE"
            | "PAST_DUE"
            | "CANCELLED"
            | "EXPIRED",
        }
      : {}),
    ...(opts.planId ? { planId: opts.planId } : {}),
    ...(opts.q
      ? { box: { name: { contains: opts.q, mode: "insensitive" as const } } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prismaBase.saasSubscription.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        startsAt: true,
        currentPeriodEnd: true,
        cancelledAt: true,
        planId: true,
        box: { select: { id: true, name: true, slug: true } },
        plan: {
          select: { id: true, name: true, slug: true, priceMxnCents: true },
        },
      },
    }),
    prismaBase.saasSubscription.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      boxId: r.box.id,
      boxName: r.box.name,
      boxSlug: r.box.slug,
      planId: r.plan.id,
      planName: r.plan.name,
      planSlug: r.plan.slug,
      mrrCents: r.plan.priceMxnCents,
      status: r.status,
      startsAt: r.startsAt,
      currentPeriodEnd: r.currentPeriodEnd,
      cancelledAt: r.cancelledAt,
    })),
    total,
  };
}

export type InvoiceFilters = {
  page?: number;
  pageSize?: number;
  boxId?: string;
  status?: string;
  from?: Date;
  to?: Date;
};

/**
 * All invoices across all tenants.
 */
export async function listAllInvoicesCrossTenant(
  opts: InvoiceFilters = {},
): Promise<InvoiceListResult> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return { rows: [], total: 0 };

  const pageSize = opts.pageSize ?? 20;
  const page = opts.page ?? 1;
  const skip = (page - 1) * pageSize;

  const paidAtFilter: { gte?: Date; lte?: Date } = {};
  if (opts.from) paidAtFilter.gte = opts.from;
  if (opts.to) paidAtFilter.lte = opts.to;

  const where = {
    ...(opts.boxId ? { tenantId: opts.boxId } : {}),
    ...(opts.status ? { status: opts.status as "PAID" | "REFUNDED" } : {}),
    ...(paidAtFilter.gte || paidAtFilter.lte ? { paidAt: paidAtFilter } : {}),
  };

  const [rows, total] = await Promise.all([
    prismaBase.saasInvoice.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { paidAt: "desc" },
      select: {
        id: true,
        tenantId: true,
        amountMxnCents: true,
        status: true,
        paidAt: true,
        periodStart: true,
        periodEnd: true,
        box: { select: { name: true } },
        subscription: { select: { plan: { select: { name: true } } } },
      },
    }),
    prismaBase.saasInvoice.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      boxId: r.tenantId,
      boxName: r.box.name,
      planName: r.subscription.plan.name,
      amountMxnCents: r.amountMxnCents,
      status: r.status as "PAID" | "REFUNDED",
      paidAt: r.paidAt,
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
    })),
    total,
  };
}

// ─── Writes ───────────────────────────────────────────────────────────────────
// CRITICAL: every write syncs BOTH SaasSubscription.status AND Box.subscriptionStatus

/**
 * WRITE — Mark a subscription as paid manually (cash/transfer).
 * Creates a SaasInvoice PAID + activates sub + syncs Box.subscriptionStatus.
 */
export async function superMarkSubscriptionPaid(
  subscriptionId: string,
  opts: { periodMonths?: number } = {},
): Promise<{ ok: true } | { ok: false; message: string }> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return { ok: false, message: "UNAUTHORIZED" };

  // W-2: validate periodMonths range
  const rawMonths = opts.periodMonths ?? 1;
  const monthsValidation = validatePeriodMonths(rawMonths);
  if (!monthsValidation.ok)
    return { ok: false, message: monthsValidation.message };
  const periodMonths = monthsValidation.value;

  const actorId = await getSuperActorId();

  const sub = await prismaBase.saasSubscription.findUnique({
    where: { id: subscriptionId },
    select: {
      tenantId: true,
      status: true,
      planId: true,
      currentPeriodEnd: true,
      plan: { select: { priceMxnCents: true, name: true } },
    },
  });
  if (!sub) return { ok: false, message: "Suscripción no encontrada" };
  if (sub.status === "CANCELLED") {
    return {
      ok: false,
      message: "No se puede marcar como pagada una suscripción cancelada",
    };
  }

  const now = new Date();

  // C-2: ACTIVE subs → periodStart = currentPeriodEnd (no gap, no overlap)
  // PENDING/PAST_DUE/etc → periodStart = now
  const { periodStart, periodEnd, newCurrentPeriodEnd } = computeBillingPeriod(
    sub,
    periodMonths,
    now,
  );

  try {
    await prismaBase.$transaction([
      prismaBase.saasSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: "ACTIVE",
          startsAt: sub.status !== "ACTIVE" ? now : undefined,
          currentPeriodEnd: newCurrentPeriodEnd,
        },
      }),
      prismaBase.box.update({
        where: { id: sub.tenantId },
        data: { subscriptionStatus: "ACTIVE" },
      }),
      prismaBase.saasInvoice.create({
        data: {
          tenantId: sub.tenantId,
          subscriptionId,
          amountMxnCents: sub.plan.priceMxnCents * periodMonths,
          status: "PAID",
          periodStart,
          periodEnd,
          paidAt: now,
        },
      }),
    ]);
  } catch (err: unknown) {
    // W-4: guard against duplicate invoice for the same period
    const prismaCode =
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code;
    if (prismaCode === "P2002") {
      return { ok: false, message: "Ya existe una factura para este período." };
    }
    throw err;
  }

  await logAudit({
    tenantId: sub.tenantId,
    actorId,
    action: "SAAS_SUB_MARKED_PAID",
    targetType: "SaasSubscription",
    targetId: subscriptionId,
    metadata: {
      periodMonths,
      periodStart: periodStart.toISOString(),
      newCurrentPeriodEnd: newCurrentPeriodEnd.toISOString(),
    },
  });

  revalidatePath("/admin/super/pagos");
  return { ok: true };
}

/**
 * WRITE — Extend trial for a box (adjusts trialEndsAt + currentPeriodEnd).
 */
export async function superExtendTrial(
  boxId: string,
  opts: { days: number },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return { ok: false, message: "UNAUTHORIZED" };

  // W-3: validate days range
  const daysValidation = validateTrialDays(opts.days);
  if (!daysValidation.ok) return { ok: false, message: daysValidation.message };
  const days = daysValidation.value;

  const actorId = await getSuperActorId();

  const box = await prismaBase.box.findUnique({
    where: { id: boxId },
    select: { subscriptionStatus: true, trialEndsAt: true },
  });
  if (!box) return { ok: false, message: "Box no encontrado" };

  // S-1: only allow extending boxes that are in TRIAL status
  if (box.subscriptionStatus !== "TRIAL") {
    return {
      ok: false,
      message: "Solo se puede extender el trial de boxes en estado TRIAL.",
    };
  }

  const base = box.trialEndsAt ?? new Date();
  const newTrialEnd = new Date(base);
  newTrialEnd.setDate(newTrialEnd.getDate() + days);

  // W-1: wrap both writes in a single transaction (conditional findFirst inside callback form)
  await prismaBase.$transaction(async (tx) => {
    await tx.box.update({
      where: { id: boxId },
      data: { trialEndsAt: newTrialEnd },
    });

    // Also extend currentPeriodEnd on any PENDING/ACTIVE subscription
    const activeSub = await tx.saasSubscription.findFirst({
      where: { tenantId: boxId, status: { in: ["PENDING", "ACTIVE"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (activeSub) {
      await tx.saasSubscription.update({
        where: { id: activeSub.id },
        data: { currentPeriodEnd: newTrialEnd },
      });
    }
  });

  await logAudit({
    tenantId: boxId,
    actorId,
    action: "SAAS_TRIAL_EXTENDED",
    targetType: "Box",
    targetId: boxId,
    metadata: { days, newTrialEnd: newTrialEnd.toISOString() },
  });

  revalidatePath("/admin/super/pagos");
  return { ok: true };
}

/**
 * WRITE — Change the plan of a subscription.
 */
export async function superChangePlan(
  subscriptionId: string,
  newPlanId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return { ok: false, message: "UNAUTHORIZED" };

  const actorId = await getSuperActorId();

  const sub = await prismaBase.saasSubscription.findUnique({
    where: { id: subscriptionId },
    select: { tenantId: true, planId: true, status: true },
  });
  if (!sub) return { ok: false, message: "Suscripción no encontrada" };
  if (sub.status === "CANCELLED" || sub.status === "EXPIRED") {
    return {
      ok: false,
      message: "No se puede cambiar el plan de una suscripción inactiva",
    };
  }

  const newPlan = await prismaBase.saasPlan.findUnique({
    where: { id: newPlanId },
    select: { id: true, name: true },
  });
  if (!newPlan) return { ok: false, message: "Plan no encontrado" };

  await prismaBase.saasSubscription.update({
    where: { id: subscriptionId },
    data: { planId: newPlanId },
  });

  await logAudit({
    tenantId: sub.tenantId,
    actorId,
    action: "SAAS_SUB_PLAN_CHANGED",
    targetType: "SaasSubscription",
    targetId: subscriptionId,
    metadata: { oldPlanId: sub.planId, newPlanId, newPlanName: newPlan.name },
  });

  revalidatePath("/admin/super/pagos");
  return { ok: true };
}

/**
 * WRITE — Cancel a subscription locally (does NOT touch MercadoPago).
 * Syncs both SaasSubscription.status and Box.subscriptionStatus.
 */
export async function superCancelSubscription(
  subscriptionId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return { ok: false, message: "UNAUTHORIZED" };

  const actorId = await getSuperActorId();

  const sub = await prismaBase.saasSubscription.findUnique({
    where: { id: subscriptionId },
    select: { tenantId: true, status: true },
  });
  if (!sub) return { ok: false, message: "Suscripción no encontrada" };
  if (sub.status === "CANCELLED") {
    return { ok: false, message: "La suscripción ya está cancelada" };
  }

  await prismaBase.$transaction([
    prismaBase.saasSubscription.update({
      where: { id: subscriptionId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    }),
    prismaBase.box.update({
      where: { id: sub.tenantId },
      data: { subscriptionStatus: "CANCELLED" },
    }),
  ]);

  await logAudit({
    tenantId: sub.tenantId,
    actorId,
    action: "SAAS_SUB_CANCELLED",
    targetType: "SaasSubscription",
    targetId: subscriptionId,
    metadata: { reason: "manual_super_admin" },
  });

  revalidatePath("/admin/super/pagos");
  return { ok: true };
}

// ─── CSV export ───────────────────────────────────────────────────────────────

export async function exportCrossTenantInvoicesCsv(
  opts: InvoiceFilters = {},
): Promise<string> {
  // C-1: own auth gate — do not rely solely on the delegated helper
  const gate = await requireSuperAdmin();
  if (gate !== true) return "";

  // Export all (no pagination)
  const result = await listAllInvoicesCrossTenant({
    ...opts,
    page: 1,
    pageSize: 5000,
  });

  const header =
    "id,box,plan,amount_mxn,status,paid_at,period_start,period_end";
  const lines = result.rows.map((r) => {
    const amount = (r.amountMxnCents / 100).toFixed(2);
    return [
      r.id,
      `"${r.boxName.replace(/"/g, '""')}"`,
      `"${r.planName.replace(/"/g, '""')}"`,
      amount,
      r.status,
      r.paidAt.toISOString(),
      r.periodStart.toISOString(),
      r.periodEnd.toISOString(),
    ].join(",");
  });

  return [header, ...lines].join("\n");
}

// ─── Plan list helper ─────────────────────────────────────────────────────────

export async function listSaasPlansForSuper() {
  const gate = await requireSuperAdmin();
  if (gate !== true) return [];

  return prismaBase.saasPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, priceMxnCents: true },
  });
}
