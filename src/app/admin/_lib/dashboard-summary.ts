/**
 * The owner dashboard's numbers, derived from ONE `PeriodSummary`.
 *
 * Extracted out of `src/app/admin/page.tsx` because the mapping is where the
 * 2026-09-15 audit found its worst KPI bugs, and a bug you cannot unit-test is
 * a bug you get to ship twice:
 *
 * | Tile              | Was                                          | Is now                        |
 * | ----------------- | -------------------------------------------- | ----------------------------- |
 * | ATLETAS ACTIVOS   | seats booked today (27) vs Atletas' 42        | `athletes.active`             |
 * | EN RIESGO         | `snapshot.athletesAtRisk.length`, capped at 5 | `athletes.atRisk`             |
 * | …de N totales     | `max(atRisk, seatsBookedToday)`              | `athletes.active`             |
 * | MRR               | SaaS invoices the BOX pays Kronos             | `revenue.total` for the range |
 * | ARPU              | revenue ÷ seats booked today                  | revenue ÷ active athletes     |
 * | chart x-axis      | hardcoded `["1 abr", …]`                      | `byDay[].day`                 |
 *
 * Pure module: no Prisma, no session, no Next APIs. `PeriodSummary` is a
 * type-only import, so nothing from the server graph is pulled in at runtime.
 */
import { formatDateShort } from "@/lib/format";
import type { PeriodSummary } from "@/server/period-summary";
import { AT_RISK_DEFAULT_INACTIVITY_DAYS } from "@/server/period-summary/rules";

/**
 * `"2026-09-15"` -> `"15 sep"`.
 *
 * The key is a civil day in the box timezone, so it is read back as a civil
 * day: anchoring it in UTC and formatting in UTC means the label can never
 * drift a day because the server happens to sit west of the box.
 */
export function dayKeyLabel(dayKey: string): string {
  const [year, month, day] = dayKey
    .split("-")
    .map((n) => Number.parseInt(n, 10));
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return dayKey;
  }
  return formatDateShort(new Date(Date.UTC(year, month - 1, day)), "UTC");
}

export function dayKeyLabels(dayKeys: readonly string[]): string[] {
  return dayKeys.map(dayKeyLabel);
}

export type DashboardChart = {
  data: number[];
  /** One label per point, taken from the requested period. Never invented. */
  labels: string[];
  total: number;
  /** Signed percentage vs the previous, symmetric window. */
  deltaPct: number;
};

export type DashboardNumbers = {
  /** "últimos 30 días" — the label every tile on the page must carry. */
  periodLabel: string;
  /** The same label, shaped for the uppercase range chip in the header. */
  rangeLabel: string;
  activeAthletes: number;
  newAthletes: number;
  atRiskCount: number;
  /** Denominator of "N de M totales": the roster, not seats booked today. */
  atRiskTotal: number;
  atRiskNote?: string;
  /** PAID revenue for the range. The one revenue number on the screen. */
  mrr: number;
  mrrDeltaPct: number;
  /** Signed money difference vs the previous window. */
  mrrDeltaAbs: number;
  /** Revenue per active athlete, or `null` when there is no roster yet. */
  arpu: number | null;
  revenueChart: DashboardChart;
  attendanceChart: DashboardChart;
};

/** Signed fraction -> signed percentage, with 0 for anything non-finite. */
function pctOf(fraction: number): number {
  return Number.isFinite(fraction) ? fraction * 100 : 0;
}

/**
 * Same arithmetic `deltaPct` in `period-summary/rules` uses, in percent, for
 * the one series the summary does not carry a previous total for (attendance).
 */
export function deltaPercent(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0;
    return current > 0 ? 100 : -100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export type MapDashboardOptions = {
  /** Check-ins in the previous, symmetric window — the attendance delta. */
  previousCheckins?: number;
  /** Days without a check-in that put an athlete at risk. Default 14. */
  inactivityDays?: number;
};

export function mapDashboardSummary(
  summary: PeriodSummary,
  options: MapDashboardOptions = {},
): DashboardNumbers {
  const inactivityDays =
    options.inactivityDays ?? AT_RISK_DEFAULT_INACTIVITY_DAYS;

  const revenueDays = summary.payments.byDay;
  const attendanceDays = summary.attendance.byDay;

  const activeAthletes = summary.athletes.active;
  const atRiskCount = summary.athletes.atRisk;
  const checkins = summary.attendance.checkins;

  return {
    periodLabel: summary.period.label,
    rangeLabel: summary.period.label.toUpperCase(),
    activeAthletes,
    newAthletes: summary.athletes.newInPeriod,
    atRiskCount,
    atRiskTotal: activeAthletes,
    atRiskNote:
      atRiskCount > 0
        ? `Sin check-in hace ${inactivityDays}+ días o con membresía vencida`
        : undefined,
    mrr: summary.revenue.total,
    mrrDeltaPct: pctOf(summary.revenue.deltaPct),
    mrrDeltaAbs: summary.revenue.total - summary.revenue.previousTotal,
    arpu: activeAthletes > 0 ? summary.revenue.total / activeAthletes : null,
    revenueChart: {
      data: revenueDays.map((d) => d.revenue),
      labels: dayKeyLabels(revenueDays.map((d) => d.day)),
      total: summary.revenue.total,
      deltaPct: pctOf(summary.revenue.deltaPct),
    },
    attendanceChart: {
      data: attendanceDays.map((d) => d.attended),
      labels: dayKeyLabels(attendanceDays.map((d) => d.day)),
      total: checkins,
      deltaPct:
        options.previousCheckins === undefined
          ? 0
          : deltaPercent(checkins, options.previousCheckins),
    },
  };
}
