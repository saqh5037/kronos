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
import { can, createGrantRequest } from "../permissions";
import {
  getPreferenceClient,
  isMpConfigured,
  resolveMpBackUrlBase,
} from "@/lib/payments/mp-client";
import { type ListOpts, type ListResult, normalizePagination } from "./types";
import {
  buildPaymentsWhere,
  getBoxPeriodTimezone,
  getPeriodSummary,
  type OverdueMembershipRow,
  type PaymentDayPoint,
  type PaymentsFilter,
  type PeriodInput,
} from "../period-summary";

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

/**
 * Period-scoped payment KPIs. Every field comes from `getPeriodSummary`,
 * so the KPI row and the table below it cannot disagree (audit P0 #6:
 * "Pagos rango 27" beside "33 pagos en el rango" under the same filter).
 *
 * `monthRevenue` / `monthCount` keep their old names so `/admin/pagos`
 * compiles unchanged, but they now hold PERIOD values, not month-to-date.
 * New code should read `revenue` / `count`.
 */
export type PaymentStats = {
  /** @deprecated now holds PERIOD revenue; read `revenue` instead. */
  monthRevenue: number;
  /** @deprecated now holds the PERIOD payment count; read `count`. */
  monthCount: number;
  /** @deprecated now scoped to the period, not all-time. */
  pendingRevenue: number;
  pendingCount: number;
};

/**
 * What `getPaymentStats` actually returns. Structurally a superset of the
 * legacy `PaymentStats`, so pages that still declare the old type keep
 * compiling while new code reads the explicit, period-aware fields.
 */
export type PeriodPaymentStats = PaymentStats & {
  period: { from: Date; to: Date; label: string };
  /** PAID revenue recognised in the period. Same number Reportes shows. */
  revenue: number;
  revenuePrevious: number;
  revenueDelta: number;
  /** Payments created in the period, any status — equals the table total. */
  count: number;
  paidCount: number;
  paidTotal: number;
  failedCount: number;
  failedTotal: number;
  /** Morosos per the shared overdue rule. Never truncated by a limit. */
  overdueCount: number;
  overdueTotal: number;
};

export type PaymentSort = "createdAt" | "paidAt" | "amount";

export async function listPaymentsPaged(
  opts?: ListOpts<PaymentSort> & {
    gateway?: PaymentGateway;
  },
): Promise<ListResult<PaymentRow>> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const { page, pageSize, skip, take } = normalizePagination(opts);

  // ONE `where` for the table AND for the KPI above it. Before this, the
  // KPI counted PAID rows by `paidAt` while the table counted every row by
  // `createdAt`, which is how one filter produced both 27 and 33.
  const where = buildPaymentsWhere({
    period: { from: opts?.dateFrom, to: opts?.dateTo },
    filter: {
      status: (opts?.status as PaymentStatus | undefined) ?? undefined,
      gateway: opts?.gateway,
      search: opts?.search ?? undefined,
    },
  });

  const sortBy = opts?.sortBy ?? "createdAt";
  const sortDir = opts?.sortDir ?? "desc";
  const orderBy = { [sortBy]: sortDir };

  const [total, payments] = await Promise.all([
    db.payment.count({ where }),
    db.payment.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        membership: {
          include: {
            athlete: { select: { firstName: true, lastName: true } },
            plan: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const rows: PaymentRow[] = payments.map((p) => ({
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

  return { rows, total, page, pageSize };
}

/** Alias so existing imports keep type-checking. */
export type RevenueByDayPoint = PaymentDayPoint;

/**
 * PAID revenue per civil day of the BOX timezone, covering exactly
 * `dateFrom..dateTo`.
 *
 * Delegates to `getPeriodSummary`, whose series is generated from the
 * period instead of from the rows the query happened to return — the old
 * behaviour is why the dashboard drew an April x-axis under an "últimos
 * 30 días" label.
 */
export async function getRevenueByDay(opts: {
  dateFrom: Date;
  dateTo: Date;
  tz?: string;
}): Promise<RevenueByDayPoint[]> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const tz = opts.tz ?? (await getBoxPeriodTimezone(tenantId));
  const summary = await getPeriodSummary(tenantId, {
    from: opts.dateFrom,
    to: opts.dateTo,
    tz,
  });
  return summary.payments.byDay;
}

/** Alias so existing imports keep type-checking. */
export type OverdueMembership = OverdueMembershipRow;

/**
 * Morosos, per the single `OVERDUE_RULE` in `server/period-summary/rules`.
 *
 * The authoritative COUNT lives in `getPaymentStats().overdueCount`: this
 * function is the row list and is still capped by `limit`, so a KPI must
 * never be derived from `.length`.
 */
export async function listOverdueMemberships(
  opts?: PeriodInput & { graceDays?: number; limit?: number },
): Promise<OverdueMembership[]> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const tz = opts?.tz ?? (await getBoxPeriodTimezone(tenantId));
  const summary = await getPeriodSummary(tenantId, {
    preset: opts?.preset,
    from: opts?.from,
    to: opts?.to,
    tz,
    graceDays: opts?.graceDays,
  });
  return summary.memberships.overdueRows.slice(0, opts?.limit ?? 50);
}

/**
 * KPIs for `/admin/pagos`. Pass the SAME range and filters the table uses
 * and the numbers are identical by construction — they are two reads of one
 * request-scoped summary.
 */
export async function getPaymentStats(
  opts?: PeriodInput & { filter?: PaymentsFilter },
): Promise<PeriodPaymentStats> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const tz = opts?.tz ?? (await getBoxPeriodTimezone(tenantId));
  const summary = await getPeriodSummary(tenantId, {
    preset: opts?.preset,
    from: opts?.from,
    to: opts?.to,
    tz,
    paymentFilter: opts?.filter,
  });

  return {
    period: {
      from: summary.period.from,
      to: summary.period.to,
      label: summary.period.label,
    },
    monthRevenue: summary.revenue.total,
    monthCount: summary.payments.count,
    revenue: summary.revenue.total,
    revenuePrevious: summary.revenue.previousTotal,
    revenueDelta: summary.revenue.deltaPct,
    count: summary.payments.count,
    paidCount: summary.payments.paidCount,
    paidTotal: summary.payments.paidTotal,
    pendingRevenue: summary.payments.pendingTotal,
    pendingCount: summary.payments.pendingCount,
    failedCount: summary.payments.failedCount,
    failedTotal: summary.payments.failedTotal,
    overdueCount: summary.memberships.overdueCount,
    overdueTotal: summary.memberships.overdueTotal,
  };
}

export type PendingApprovalResult = {
  status: "pending_approval";
  requestId: string;
};

export async function registerCashPayment(
  data: unknown,
): Promise<{ ok: true } | PendingApprovalResult> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const parsed = cashPaymentSchema.parse(data);
  const db = withTenant(tenantId);

  // RBAC gate — REGISTER_CASH_PAYMENT
  const perm = await can("REGISTER_CASH_PAYMENT", session);
  if (!perm.allowed)
    throw new Error("No tienes permiso para registrar pagos en efectivo");
  if (perm.requiresApproval) {
    const requestId = await createGrantRequest({
      tenantId,
      requesterId: session.user.id,
      action: "REGISTER_CASH_PAYMENT",
      targetType: "Payment",
      targetId: parsed.membershipId,
      payload: {
        amount: parsed.amount,
        currency: parsed.currency,
        membershipId: parsed.membershipId,
      },
    });
    return { status: "pending_approval", requestId };
  }

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

  const baseUrl = resolveMpBackUrlBase();
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

export async function voidPayment(
  id: string,
): Promise<{ ok: true } | PendingApprovalResult> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;

  // RBAC gate — REFUND_PAYMENT
  const perm = await can("REFUND_PAYMENT", session);
  if (!perm.allowed) throw new Error("No tienes permiso para anular pagos");
  if (perm.requiresApproval) {
    const requestId = await createGrantRequest({
      tenantId,
      requesterId: session.user.id,
      action: "REFUND_PAYMENT",
      targetType: "Payment",
      targetId: id,
      payload: { paymentId: id },
    });
    return { status: "pending_approval", requestId };
  }

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
