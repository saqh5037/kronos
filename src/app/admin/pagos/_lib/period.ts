/**
 * One row set → every number on /admin/pagos (audit 2026-09-15, P0 #6, S4).
 *
 * The page used to read its KPIs from `getRevenueByDay` (PAID, filtered by
 * `paidAt`) and its section counts from `listPaymentsPaged` (every status,
 * filtered by `createdAt`). Two questions, one label, two answers: "27" beside
 * "33 pagos en el rango".
 *
 * Everything below is pure and derives from the single `listPaymentsPaged`
 * result the page already fetches, so the breakdown adds up to the table count
 * by construction. The proper home for this is one server-side period-summary
 * action — see the handoff note in the branch report.
 */
import { dayKey } from "@/lib/dates";
import type { OverdueMembership, PaymentRow } from "@/server/actions/payments";

export type StatusBucket = { count: number; amount: number };

/*
 * `summarizePaymentPeriod` and `dailyRevenueSeries` below are no longer read by
 * any screen.
 *
 * The handoff note above ("the proper home for this is one server-side
 * period-summary action") has been taken up: `/admin/pagos` now reads
 * `getPaymentStats` and `getRevenueByDay`, both backed by `getPeriodSummary`,
 * instead of fetching every movement of the period in 200-row chunks and
 * adding them up in the page. They are kept only because
 * `tests/unit/admin-mgmt-period.test.ts` still pins their behaviour; delete
 * both, and that file, in the same change.
 */

export type PaymentPeriodSummary = {
  /** Every movement in the period — matches the table's own count. */
  total: number;
  paid: StatusBucket;
  pending: StatusBucket;
  failed: StatusBucket;
  refunded: StatusBucket;
};

const EMPTY: StatusBucket = { count: 0, amount: 0 };

export function summarizePaymentPeriod(
  rows: readonly PaymentRow[],
): PaymentPeriodSummary {
  const summary: PaymentPeriodSummary = {
    total: rows.length,
    paid: { ...EMPTY },
    pending: { ...EMPTY },
    failed: { ...EMPTY },
    refunded: { ...EMPTY },
  };

  for (const row of rows) {
    const bucket =
      row.status === "PAID"
        ? summary.paid
        : row.status === "PENDING"
          ? summary.pending
          : row.status === "FAILED"
            ? summary.failed
            : summary.refunded;
    bucket.count += 1;
    bucket.amount += row.amount;
  }

  return summary;
}

export type RevenuePoint = { day: string; revenue: number; count: number };

/**
 * Collected money per rendered day. Only PAID rows count, so a point is never
 * negative and the axis has no reason to start below zero.
 */
export function dailyRevenueSeries(
  rows: readonly PaymentRow[],
  days: readonly string[],
): RevenuePoint[] {
  const byDay = new Map<string, RevenuePoint>();
  for (const day of days) byDay.set(day, { day, revenue: 0, count: 0 });

  for (const row of rows) {
    if (row.status !== "PAID") continue;
    const when = row.paidAt ?? row.createdAt;
    const point = byDay.get(dayKey(when));
    if (!point) continue; // paid outside the rendered window
    point.revenue += row.amount;
    point.count += 1;
  }

  return days.map((day) => byDay.get(day)!);
}

export type OverdueGroup = {
  key: string;
  athleteId: string;
  athleteName: string;
  planName: string;
  /** Oldest unpaid period for this athlete + plan. */
  endDate: Date;
  daysOverdue: number;
  pendingAmount: number;
  currency: string;
  /** How many expired memberships were collapsed into this row. */
  occurrences: number;
};

/**
 * One row per athlete + plan. The seeded feed listed "Joaquín Ortiz · Drop-in"
 * twice because he has two expired drop-in memberships; the owner needs one
 * line with the total he owes, not two identical $250 rows.
 */
export function dedupeOverdueMemberships(
  rows: readonly OverdueMembership[],
): OverdueGroup[] {
  const groups = new Map<string, OverdueGroup>();

  for (const row of rows) {
    const key = `${row.athleteId}::${row.planName}`;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        key,
        athleteId: row.athleteId,
        athleteName: row.athleteName,
        planName: row.planName,
        endDate: row.endDate,
        daysOverdue: row.daysOverdue,
        pendingAmount: row.pendingAmount,
        currency: row.currency,
        occurrences: 1,
      });
      continue;
    }
    existing.pendingAmount += row.pendingAmount;
    existing.occurrences += 1;
    if (row.endDate.getTime() < existing.endDate.getTime()) {
      existing.endDate = row.endDate;
    }
    existing.daysOverdue = Math.max(existing.daysOverdue, row.daysOverdue);
  }

  return Array.from(groups.values()).sort(
    (a, b) => b.daysOverdue - a.daysOverdue,
  );
}

/** Plan card facts in Spanish, pluralised properly. */
export function planCardLines(plan: {
  classesPerMonth: number | null;
  durationDays: number | null;
  activeMembershipCount: number;
}): string[] {
  const lines: string[] = [];
  if (plan.classesPerMonth != null) {
    lines.push(
      `${plan.classesPerMonth} ${plan.classesPerMonth === 1 ? "clase" : "clases"}/mes`,
    );
  }
  if (plan.durationDays != null) {
    lines.push(
      `${plan.durationDays} ${plan.durationDays === 1 ? "día" : "días"}`,
    );
  }
  lines.push(
    plan.activeMembershipCount === 0
      ? "Sin membresías activas"
      : `${plan.activeMembershipCount} ${
          plan.activeMembershipCount === 1
            ? "membresía activa"
            : "membresías activas"
        }`,
  );
  return lines;
}
