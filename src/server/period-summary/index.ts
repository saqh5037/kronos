/**
 * `getPeriodSummary` — the single server-side answer to "what happened in this
 * box during this period?".
 *
 * Every admin KPI must read from here. This is the fix for P0 #6 of the
 * 2026-09-15 audit ("KPIs, section counts and pages disagree on payments,
 * revenue, active and at-risk athletes") and for systemic issue S4, "one fact,
 * many numbers".
 *
 * What the audit found, and what this module does about it:
 *
 * | Screen mismatch                                    | Cause                                                                     | Fix                                                |
 * | -------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
 * | Pagos KPI 27 vs table 33, same filter              | KPI counted PAID rows by `paidAt`; the table counted every row by `createdAt` | both read `buildPaymentsWhere` → `payments.count`   |
 * | Pagos $138,750 vs Reportes $214,000, "30 días"     | Pagos summed `paidAt` up to today; Reportes summed the whole calendar month, future rows included | one `revenue.total` for one explicit, labelled period |
 * | Dashboard 27 activos vs Atletas 42                 | the dashboard used "seats booked today" as "atletas activos"              | `athletes.active` = `Athlete.status = ACTIVE`       |
 * | En riesgo 0 (dashboard, Reportes) vs 3 vs 4 morosos | three different detectors                                                 | one `AT_RISK_RULE`; morosos are a subset of it      |
 * | April x-axis under "últimos 30 días"               | the series was built from the rows returned                               | `byDay` generated from `from..to` in the box timezone |
 *
 * Caching: memoised **per request** with React `cache()` over primitive
 * arguments (see `getPeriodSummary`). There is deliberately no cross-request
 * TTL layer — a stale KPI sitting next to a live table is exactly the bug this
 * module exists to remove.
 */

import { cache } from "react";
import { withTenant, db as rawDb } from "../db";
import {
  dayKeyInTz,
  eachDayKeyInPeriod,
  previousPeriodOf,
  resolvePeriod,
  type LabelledPeriod,
  type Period,
  type PeriodInput,
  type PeriodPreset,
} from "./period";
import {
  ACTIVE_ATHLETE_RULE,
  AT_RISK_DEFAULT_INACTIVITY_DAYS,
  AT_RISK_RULE,
  OVERDUE_DEFAULT_GRACE_DAYS,
  OVERDUE_MEMBERSHIP_STATUSES,
  OVERDUE_RULE,
  deltaPct,
  describeAtRisk,
  evaluateAtRisk,
  isMembershipOverdue,
  noShowRate,
  overdueAmountOf,
  type AtRiskReason,
  type AtRiskSeverity,
} from "./rules";
import {
  buildAttendanceSeries,
  buildPaymentsWhere,
  paidRevenueWhere,
  queryAttendanceBuckets,
  queryCapacityBuckets,
  queryPaidRevenueBuckets,
  type PaymentsFilter,
} from "./queries";

export * from "./period";
export * from "./rules";
export {
  buildAttendanceSeries,
  buildPaymentsWhere,
  paidRevenueWhere,
  queryAttendanceBuckets,
  queryCapacityBuckets,
  queryPaidRevenueBuckets,
  type PaymentsFilter,
} from "./queries";

// ─── Shapes ─────────────────────────────────────────────────────────────────

/**
 * One civil day of payment activity. Shape-compatible with the old
 * `RevenueByDayPoint`, so `getRevenueByDay` returns these unchanged.
 */
export type PaymentDayPoint = {
  /** `YYYY-MM-DD` in the box timezone. */
  day: string;
  /** PAID revenue recognised that day. */
  revenue: number;
  /** Number of PAID payments that day. */
  count: number;
};

/** One civil day of attendance. Superset of the old `AttendanceByDayPoint`. */
export type AttendanceDayPoint = {
  day: string;
  attended: number;
  noShow: number;
  /** Bookings still in `BOOKED` — rendered as "Reservadas". */
  booked: number;
  /** Seats taken = attended + noShow + booked (excludes WAITLIST/CANCELLED). */
  seats: number;
  capacity: number;
  classes: number;
};

export type OverdueMembershipRow = {
  membershipId: string;
  athleteId: string;
  athleteName: string;
  planName: string;
  endDate: Date;
  daysOverdue: number;
  pendingAmount: number;
  currency: string;
};

export type AtRiskAthleteRow = {
  athleteId: string;
  firstName: string;
  lastName: string;
  name: string;
  daysSinceLastAttendance: number | null;
  hasOverdueMembership: boolean;
  reasons: AtRiskReason[];
  reasonLabels: string[];
  severity: AtRiskSeverity;
};

export type PeriodSummary = {
  period: {
    from: Date;
    to: Date;
    label: string;
    tz: string;
    preset?: PeriodPreset;
  };
  payments: {
    /**
     * Every payment created in the period, any status. This is the number the
     * Pagos table shows as its total, so it is the number the Pagos KPI shows.
     */
    count: number;
    /** PAID payments whose `paidAt` falls in the period. */
    paidCount: number;
    paidTotal: number;
    /** PENDING payments created in the period. */
    pendingCount: number;
    pendingTotal: number;
    /** FAILED payments created in the period. */
    failedCount: number;
    failedTotal: number;
    byDay: PaymentDayPoint[];
  };
  memberships: {
    active: number;
    paused: number;
    expired: number;
    cancelled: number;
    pending: number;
    /** Morosos, per `OVERDUE_RULE`. Authoritative count (never truncated). */
    overdueCount: number;
    overdueTotal: number;
    /** The morosos themselves, so the table and the KPI cannot disagree. */
    overdueRows: OverdueMembershipRow[];
  };
  athletes: {
    /** `Athlete.status = ACTIVE`, per `ACTIVE_ATHLETE_RULE`. */
    active: number;
    newInPeriod: number;
    /** At-risk athletes per `AT_RISK_RULE`, evaluated as of `period.to`. */
    atRisk: number;
    atRiskRule: string;
    atRiskRows: AtRiskAthleteRow[];
  };
  attendance: {
    /** Bookings with status ATTENDED for classes inside the period. */
    checkins: number;
    /** Seats taken (attended + noShow + booked) for classes in the period. */
    bookings: number;
    noShows: number;
    noShowRate: number;
    byDay: AttendanceDayPoint[];
  };
  revenue: {
    /** Identical to `payments.paidTotal`; the one revenue number. */
    total: number;
    previousTotal: number;
    deltaPct: number;
  };
  rules: {
    activeAthlete: string;
    atRisk: string;
    overdue: string;
  };
};

export type PeriodSummaryOptions = PeriodInput & {
  /** Mirrors the Pagos table filters so KPI and table stay identical. */
  paymentFilter?: PaymentsFilter;
  /** Days without a check-in before an athlete is at risk. Default 14. */
  inactivityDays?: number;
  /** Grace days before a lapsed membership counts as overdue. Default 0. */
  graceDays?: number;
  /** Injected for tests; defaults to `new Date()`. Only affects presets. */
  now?: Date;
  /** Internal: a period already resolved by `getPeriodSummary`. */
  period?: LabelledPeriod;
};

// ─── Computation ────────────────────────────────────────────────────────────

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function normalizeFilterKey(filter?: PaymentsFilter): string {
  return [
    filter?.status ?? "",
    filter?.gateway ?? "",
    (filter?.search ?? "").trim().toLowerCase(),
  ].join("|");
}

/**
 * The per-request memo key. Exported so the tenant-scoping invariant is
 * testable: `tenantId` is always the first segment, so no two boxes can ever
 * share an entry.
 */
export function periodSummaryCacheKey(
  tenantId: string,
  period: LabelledPeriod,
  options: Pick<
    PeriodSummaryOptions,
    "paymentFilter" | "inactivityDays" | "graceDays"
  > = {},
): string {
  return [
    tenantId,
    period.from.getTime(),
    period.to.getTime(),
    period.tz,
    period.preset ?? "",
    normalizeFilterKey(options.paymentFilter),
    options.inactivityDays ?? AT_RISK_DEFAULT_INACTIVITY_DAYS,
    options.graceDays ?? OVERDUE_DEFAULT_GRACE_DAYS,
  ].join("::");
}

/**
 * Computes the summary. Uncached and session-free: `tenantId` is explicit so
 * this can be called from a cron, a test or a server action alike.
 *
 * Multi-tenancy: reads go through `withTenant(tenantId)`; the `aggregate`,
 * `groupBy` and `$queryRaw` calls that the extension does not cover filter
 * `tenantId` explicitly.
 */
export async function computePeriodSummary(
  tenantId: string,
  options: PeriodSummaryOptions = {},
): Promise<PeriodSummary> {
  if (!tenantId) throw new Error("No tenant context active");

  const now = options.now ?? new Date();
  const period: LabelledPeriod = options.period ?? resolvePeriod(options, now);
  const previous = previousPeriodOf(period);
  const inactivityDays =
    options.inactivityDays ?? AT_RISK_DEFAULT_INACTIVITY_DAYS;
  const graceDays = options.graceDays ?? OVERDUE_DEFAULT_GRACE_DAYS;

  // At-risk and overdue are "as of" facts, not period sums. They are evaluated
  // at the end of the reported window so the number is deterministic and
  // testable (for the default "últimos 30 días" that is today).
  const asOf = period.to;

  const db = withTenant(tenantId);

  const [
    paymentsCount,
    paidAgg,
    pendingAgg,
    failedAgg,
    prevPaidAgg,
    revenueBuckets,
    membershipStatusGroups,
    overdueCandidates,
    activeAthletes,
    newAthletes,
    activeAthleteRows,
    attendanceBuckets,
    capacityBuckets,
  ] = await Promise.all([
    db.payment.count({
      where: buildPaymentsWhere({ period, filter: options.paymentFilter }),
    }),
    rawDb.payment.aggregate({
      where: { tenantId, ...paidRevenueWhere(period) },
      _sum: { amount: true },
      _count: { id: true },
    }),
    rawDb.payment.aggregate({
      where: {
        tenantId,
        status: "PENDING",
        createdAt: { gte: period.from, lte: period.to },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    rawDb.payment.aggregate({
      where: {
        tenantId,
        status: "FAILED",
        createdAt: { gte: period.from, lte: period.to },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    rawDb.payment.aggregate({
      where: { tenantId, ...paidRevenueWhere(previous) },
      _sum: { amount: true },
    }),
    queryPaidRevenueBuckets(tenantId, period),
    rawDb.membership.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { _all: true },
    }),
    // Overdue candidates: the DB clause is only a pre-selection; the rule
    // itself is applied in TS so there is exactly one implementation of it.
    db.membership.findMany({
      where: {
        status: { in: OVERDUE_MEMBERSHIP_STATUSES },
        endDate: { not: null, lt: asOf },
      },
      orderBy: { endDate: "asc" },
      select: {
        id: true,
        status: true,
        endDate: true,
        athlete: { select: { id: true, firstName: true, lastName: true } },
        plan: { select: { name: true, price: true, currency: true } },
        payments: { where: { status: "PENDING" }, select: { amount: true } },
      },
    }),
    db.athlete.count({ where: { status: "ACTIVE" } }),
    db.athlete.count({
      where: { createdAt: { gte: period.from, lte: period.to } },
    }),
    db.athlete.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        bookings: {
          where: { status: "ATTENDED", checkedInAt: { not: null } },
          orderBy: { checkedInAt: "desc" },
          take: 1,
          select: { checkedInAt: true },
        },
      },
    }),
    queryAttendanceBuckets(tenantId, period),
    queryCapacityBuckets(tenantId, period),
  ]);

  // ── payments · day series generated from the PERIOD, not from the rows ────
  const revenueByKey = new Map(revenueBuckets.map((b) => [b.day, b]));
  const dayKeys = eachDayKeyInPeriod(period);
  const paymentsByDay: PaymentDayPoint[] = dayKeys.map((day) => {
    const bucket = revenueByKey.get(day);
    return { day, revenue: bucket?.revenue ?? 0, count: bucket?.count ?? 0 };
  });

  // ── attendance · same period-driven series ───────────────────────────────
  const attendanceByDay: AttendanceDayPoint[] = buildAttendanceSeries(
    period,
    attendanceBuckets,
    capacityBuckets,
  );

  const checkins = attendanceByDay.reduce((s, d) => s + d.attended, 0);
  const noShows = attendanceByDay.reduce((s, d) => s + d.noShow, 0);
  const seats = attendanceByDay.reduce((s, d) => s + d.seats, 0);

  // ── memberships ──────────────────────────────────────────────────────────
  const statusCount = (status: string) =>
    membershipStatusGroups.find((g) => g.status === status)?._count._all ?? 0;

  const overdueRows: OverdueMembershipRow[] = overdueCandidates
    .filter((m) =>
      isMembershipOverdue(
        { status: m.status, endDate: m.endDate },
        asOf,
        graceDays,
      ),
    )
    .map((m) => {
      const endDate = m.endDate as Date;
      return {
        membershipId: m.id,
        athleteId: m.athlete.id,
        athleteName: `${m.athlete.firstName} ${m.athlete.lastName}`,
        planName: m.plan.name,
        endDate,
        daysOverdue: Math.floor(
          (asOf.getTime() - endDate.getTime()) / 86400000,
        ),
        pendingAmount: overdueAmountOf({
          pendingAmounts: m.payments.map((p) => toNumber(p.amount)),
          planPrice: toNumber(m.plan.price),
        }),
        currency: m.plan.currency,
      };
    });

  const overdueAthleteIds = new Set(overdueRows.map((r) => r.athleteId));

  // ── athletes · at risk ───────────────────────────────────────────────────
  const atRiskRows: AtRiskAthleteRow[] = [];
  for (const a of activeAthleteRows) {
    const evaluation = evaluateAtRisk(
      {
        createdAt: a.createdAt,
        lastAttendedAt: a.bookings[0]?.checkedInAt ?? null,
        hasOverdueMembership: overdueAthleteIds.has(a.id),
      },
      asOf,
      inactivityDays,
    );
    if (!evaluation.atRisk) continue;
    atRiskRows.push({
      athleteId: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      name: `${a.firstName} ${a.lastName}`,
      daysSinceLastAttendance: evaluation.daysSinceLastAttendance,
      hasOverdueMembership: overdueAthleteIds.has(a.id),
      reasons: evaluation.reasons,
      reasonLabels: describeAtRisk(evaluation, inactivityDays),
      severity: evaluation.severity,
    });
  }

  const severityRank: Record<AtRiskSeverity, number> = {
    high: 3,
    med: 2,
    low: 1,
  };
  atRiskRows.sort((x, y) => {
    const bySeverity = severityRank[y.severity] - severityRank[x.severity];
    if (bySeverity !== 0) return bySeverity;
    const xd = x.daysSinceLastAttendance ?? Number.POSITIVE_INFINITY;
    const yd = y.daysSinceLastAttendance ?? Number.POSITIVE_INFINITY;
    if (xd === yd) return x.name.localeCompare(y.name, "es-MX");
    return yd - xd;
  });

  const paidTotal = toNumber(paidAgg._sum.amount);
  const previousTotal = toNumber(prevPaidAgg._sum.amount);

  return {
    period: {
      from: period.from,
      to: period.to,
      label: period.label,
      tz: period.tz,
      preset: period.preset,
    },
    payments: {
      count: paymentsCount,
      paidCount: paidAgg._count.id,
      paidTotal,
      pendingCount: pendingAgg._count.id,
      pendingTotal: toNumber(pendingAgg._sum.amount),
      failedCount: failedAgg._count.id,
      failedTotal: toNumber(failedAgg._sum.amount),
      byDay: paymentsByDay,
    },
    memberships: {
      active: statusCount("ACTIVE"),
      paused: statusCount("PAUSED"),
      expired: statusCount("EXPIRED"),
      cancelled: statusCount("CANCELLED"),
      pending: statusCount("PENDING"),
      overdueCount: overdueRows.length,
      overdueTotal: overdueRows.reduce((s, r) => s + r.pendingAmount, 0),
      overdueRows,
    },
    athletes: {
      active: activeAthletes,
      newInPeriod: newAthletes,
      atRisk: atRiskRows.length,
      atRiskRule: AT_RISK_RULE,
      atRiskRows,
    },
    attendance: {
      checkins,
      bookings: seats,
      noShows,
      noShowRate: noShowRate({ checkins, noShows }),
      byDay: attendanceByDay,
    },
    revenue: {
      total: paidTotal,
      previousTotal,
      deltaPct: deltaPct(paidTotal, previousTotal),
    },
    rules: {
      activeAthlete: ACTIVE_ATHLETE_RULE,
      atRisk: AT_RISK_RULE,
      overdue: OVERDUE_RULE,
    },
  };
}

/**
 * React `cache()` memoises on ARGUMENT IDENTITY, so the cached function only
 * ever receives primitives. Passing the options object straight through would
 * defeat the memo (every caller builds a fresh object) — the same class of
 * mistake documented in `src/server/session.ts`, where an empty cache key
 * leaked a session across requests.
 *
 * `tenantId` is the first argument, so the memo entry is tenant-scoped by
 * construction: there is no string key that could ever be shared across boxes.
 */
const computeForKey = cache(
  async (
    tenantId: string,
    fromMs: number,
    toMs: number,
    tz: string,
    preset: string,
    label: string,
    status: string,
    gateway: string,
    search: string,
    inactivityDays: number,
    graceDays: number,
  ): Promise<PeriodSummary> =>
    computePeriodSummary(tenantId, {
      period: {
        from: new Date(fromMs),
        to: new Date(toMs),
        tz,
        preset: (preset || undefined) as PeriodPreset | undefined,
        label,
      },
      paymentFilter: {
        ...(status ? { status: status as PaymentsFilter["status"] } : {}),
        ...(gateway ? { gateway: gateway as PaymentsFilter["gateway"] } : {}),
        ...(search ? { search } : {}),
      },
      inactivityDays,
      graceDays,
    }),
);

/**
 * Request-scoped summary. Every KPI on a page reads the *same* object,
 * computed once, so two numbers rendered 2,000 px apart cannot come from two
 * different query runs. Outside a request scope (tests, scripts) React's
 * `cache` degrades to a plain call, which is harmless.
 */
export async function getPeriodSummary(
  tenantId: string,
  options: PeriodSummaryOptions = {},
): Promise<PeriodSummary> {
  if (!tenantId) throw new Error("No tenant context active");
  const period =
    options.period ?? resolvePeriod(options, options.now ?? new Date());
  const filter = options.paymentFilter;
  return computeForKey(
    tenantId,
    period.from.getTime(),
    period.to.getTime(),
    period.tz,
    period.preset ?? "",
    period.label,
    filter?.status ?? "",
    filter?.gateway ?? "",
    (filter?.search ?? "").trim(),
    options.inactivityDays ?? AT_RISK_DEFAULT_INACTIVITY_DAYS,
    options.graceDays ?? OVERDUE_DEFAULT_GRACE_DAYS,
  );
}

/**
 * Resolves the box timezone so callers can build a period in box-local time.
 * Falls back to UTC when the box has none. Memoised per request.
 */
export const getBoxPeriodTimezone = cache(
  async (tenantId: string): Promise<string> => {
    try {
      const box = await rawDb.box.findUnique({
        where: { id: tenantId },
        select: { timezone: true },
      });
      return box?.timezone ?? "UTC";
    } catch {
      // A timezone lookup must never be the reason a dashboard 500s.
      return "UTC";
    }
  },
);

/**
 * Convenience for server actions: resolve the box timezone and the period in
 * one step, so a page that passes `{ preset: "last30" }` gets a window in the
 * box's civil days rather than the server's.
 */
export async function resolveBoxPeriod(
  tenantId: string,
  input: PeriodInput = {},
  now: Date = new Date(),
): Promise<LabelledPeriod> {
  const tz = input.tz ?? (await getBoxPeriodTimezone(tenantId));
  return resolvePeriod({ ...input, tz }, now);
}

export { dayKeyInTz };
export type { Period, LabelledPeriod, PeriodInput };
