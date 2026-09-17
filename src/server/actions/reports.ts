"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import type { PlanType } from "@/lib/validations/membership";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";
import { monthKey } from "@/lib/dates";
import {
  getBoxPeriodTimezone,
  getPeriodSummary,
  type PeriodInput,
} from "../period-summary";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type Reports = {
  generatedAt: Date;
  /**
   * The window every number below belongs to. RENDER `period.label` next to
   * the headline: the audit found "Ingresos del mes $214,000" beside a
   * filter that said "Últimos 30 días" while Pagos said $138,750.
   */
  period: { from: Date; to: Date; label: string };
  // Headline KPIs (the selected period; defaults to this month)
  monthRevenue: number;
  prevMonthRevenue: number;
  revenueDelta: number; // (current - prev) / prev (or 0 if prev=0)
  mrr: number; // sum of active monthly-equivalent membership prices

  // Attendance
  monthClassesHeld: number; // classes whose startsAt is in current month
  monthBookings: number;
  monthAttended: number;
  monthNoShow: number;
  attendanceRate: number; // attended / (attended + noshow + cancelled-after-booking proxy: booked count)

  // Athletes
  activeAthletes: number;
  pausedAthletes: number;
  newAthletesMonth: number;
  churnedMembershipsMonth: number;
  /** Same rule and same number as /admin/atletas and the dashboard. */
  athletesAtRisk: number;
  atRiskRule: string;
  /** Morosos; the same number /admin/pagos shows. */
  overdueCount: number;
  overdueTotal: number;

  // Activity
  monthScores: number;
  monthPRs: number;

  // Top lists
  topWODs: { wodId: string; name: string; scoreCount: number }[];
  topAttendees: { athleteName: string; attendedCount: number }[];

  // Plan distribution
  planDistribution: { type: PlanType; count: number; revenue: number }[];
};

/**
 * Reportes KPIs for one explicit period.
 *
 * Defaults to "este mes" so the existing headline copy stays true, but the
 * page MUST pass the same `{ from, to }` its filter shows — that is what
 * makes Reportes and Pagos print the same revenue for the same window.
 * Revenue, athletes, attendance and at-risk all come from the shared
 * `getPeriodSummary`, so there is nothing left to drift.
 */
export async function getReports(opts?: PeriodInput): Promise<Reports> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const now = new Date();
  const tz = opts?.tz ?? (await getBoxPeriodTimezone(tenantId));
  const summary = await getPeriodSummary(tenantId, {
    preset: opts?.preset ?? "thisMonth",
    from: opts?.from,
    to: opts?.to,
    tz,
  });
  const periodStart = summary.period.from;
  const periodEnd = summary.period.to;

  const [
    activeMemberships,
    pausedAthletesCount,
    churnedMemberships,
    scoresThisMonth,
    prsThisMonth,
    topWODsRaw,
    topAttendeesRaw,
    planGrouping,
  ] = await Promise.all([
    db.membership.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true },
    }),
    db.athlete.count({ where: { status: "PAUSED" } }),
    db.membership.count({
      where: {
        status: "CANCELLED",
        // Use createdAt as proxy — schema has no cancelledAt yet
        // Future: add cancelledAt field for real churn tracking
      },
    }),
    db.score.count({
      where: { createdAt: { gte: periodStart, lte: periodEnd } },
    }),
    db.pR.count({
      where: { achievedAt: { gte: periodStart, lte: periodEnd } },
    }),
    // `withTenant` now scopes `groupBy` too (audit P0-1), but these two
    // aggregations used to rank EVERY box in the database inside one owner's
    // report, so they also name the tenant explicitly: a reader of this file
    // should not have to trust an extension they cannot see.
    db.score.groupBy({
      by: ["wodId"],
      where: { tenantId, createdAt: { gte: periodStart, lte: periodEnd } },
      _count: { _all: true },
      orderBy: { _count: { wodId: "desc" } },
      take: 5,
    }),
    db.booking.groupBy({
      by: ["athleteId"],
      where: {
        tenantId,
        status: "ATTENDED",
        class: { startsAt: { gte: periodStart, lte: periodEnd } },
      },
      _count: { _all: true },
      orderBy: { _count: { athleteId: "desc" } },
      take: 5,
    }),
    db.membership.findMany({
      where: { status: "ACTIVE" },
      select: { plan: { select: { type: true, price: true } } },
    }),
  ]);

  const classesHeld = summary.attendance.byDay.reduce(
    (s, d) => s + d.classes,
    0,
  );
  const activeAthletesCount = summary.athletes.active;
  const newAthletes = summary.athletes.newInPeriod;

  // The one revenue number. Pagos reads the same field of the same summary.
  const monthRevenue = summary.revenue.total;
  const prevMonthRevenue = summary.revenue.previousTotal;
  const revenueDelta = summary.revenue.deltaPct;

  // MRR: monthly-equivalent of all active memberships
  const mrr = activeMemberships.reduce((acc, m) => {
    const price = Number(m.plan.price);
    switch (m.plan.type) {
      case "MONTHLY":
        return acc + price;
      case "ANNUAL":
        return acc + price / 12;
      case "PACKAGE":
      case "DROPIN":
      case "FAMILY":
      case "UNLIMITED":
        // For non-monthly plans, amortize over duration if defined, else best effort
        if (m.plan.durationDays && m.plan.durationDays > 0) {
          return acc + (price * 30) / m.plan.durationDays;
        }
        return acc + price; // fallback
      default:
        return acc;
    }
  }, 0);

  const monthBookings = summary.attendance.bookings;
  const monthAttended = summary.attendance.checkins;
  const monthNoShow = summary.attendance.noShows;
  const attendanceRate = 1 - summary.attendance.noShowRate;

  // Resolve WOD names for top WODs
  const topWODIds = topWODsRaw.map((w) => w.wodId);
  const wods = topWODIds.length
    ? await db.wOD.findMany({
        where: { id: { in: topWODIds } },
        select: { id: true, name: true },
      })
    : [];
  const wodMap = new Map(wods.map((w) => [w.id, w.name]));
  const topWODs = topWODsRaw.map((w) => ({
    wodId: w.wodId,
    name: wodMap.get(w.wodId) ?? "—",
    scoreCount: w._count._all,
  }));

  // Resolve athlete names
  const topAthleteIds = topAttendeesRaw.map((a) => a.athleteId);
  const athletes = topAthleteIds.length
    ? await db.athlete.findMany({
        where: { id: { in: topAthleteIds } },
        select: { id: true, firstName: true, lastName: true },
      })
    : [];
  const athleteMap = new Map(
    athletes.map((a) => [a.id, `${a.firstName} ${a.lastName}`]),
  );
  const topAttendees = topAttendeesRaw.map((a) => ({
    athleteName: athleteMap.get(a.athleteId) ?? "—",
    attendedCount: a._count._all,
  }));

  // Plan distribution
  const planMap = new Map<PlanType, { count: number; revenue: number }>();
  for (const m of planGrouping) {
    const type = m.plan.type as PlanType;
    const existing = planMap.get(type);
    if (existing) {
      existing.count++;
      existing.revenue += Number(m.plan.price);
    } else {
      planMap.set(type, { count: 1, revenue: Number(m.plan.price) });
    }
  }
  const planDistribution = Array.from(planMap.entries())
    .map(([type, v]) => ({ type, count: v.count, revenue: v.revenue }))
    .sort((a, b) => b.count - a.count);

  return {
    generatedAt: now,
    period: {
      from: summary.period.from,
      to: summary.period.to,
      label: summary.period.label,
    },
    monthRevenue,
    prevMonthRevenue,
    revenueDelta,
    mrr,
    monthClassesHeld: classesHeld,
    monthBookings,
    monthAttended,
    monthNoShow,
    attendanceRate,
    activeAthletes: activeAthletesCount,
    pausedAthletes: pausedAthletesCount,
    newAthletesMonth: newAthletes,
    churnedMembershipsMonth: churnedMemberships,
    athletesAtRisk: summary.athletes.atRisk,
    atRiskRule: summary.athletes.atRiskRule,
    overdueCount: summary.memberships.overdueCount,
    overdueTotal: summary.memberships.overdueTotal,
    monthScores: scoresThisMonth,
    monthPRs: prsThisMonth,
    topWODs,
    topAttendees,
    planDistribution,
  };
}

export type RevenueByMonthPoint = {
  month: string; // YYYY-MM
  revenue: number;
  paymentCount: number;
};

export async function getRevenueByMonth(
  months: number = 12,
): Promise<RevenueByMonthPoint[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const now = new Date();
  const from = startOfMonth(subMonths(now, months - 1));
  const to = endOfMonth(now);

  const payments = await db.payment.findMany({
    where: {
      status: "PAID",
      paidAt: { gte: from, lte: to, not: null },
    },
    select: { amount: true, paidAt: true },
  });

  const byMonth = new Map<string, { revenue: number; count: number }>();
  for (const p of payments) {
    if (!p.paidAt) continue;
    const k = monthKey(p.paidAt);
    const existing = byMonth.get(k) ?? { revenue: 0, count: 0 };
    existing.revenue += Number(p.amount);
    existing.count += 1;
    byMonth.set(k, existing);
  }

  const out: RevenueByMonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(now, i);
    const k = monthKey(d);
    const v = byMonth.get(k) ?? { revenue: 0, count: 0 };
    out.push({ month: k, revenue: v.revenue, paymentCount: v.count });
  }
  return out;
}

export type AthletesByMonthPoint = {
  month: string;
  newAthletes: number;
  churnedMemberships: number;
};

export async function getAthletesByMonth(
  months: number = 12,
): Promise<AthletesByMonthPoint[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const now = new Date();
  const from = startOfMonth(subMonths(now, months - 1));
  const to = endOfMonth(now);

  const [newAthletes, cancelled] = await Promise.all([
    db.athlete.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
    }),
    db.membership.findMany({
      where: { status: "CANCELLED", createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
    }),
  ]);

  const newByMonth = new Map<string, number>();
  for (const a of newAthletes) {
    const k = monthKey(a.createdAt);
    newByMonth.set(k, (newByMonth.get(k) ?? 0) + 1);
  }

  const churnByMonth = new Map<string, number>();
  for (const c of cancelled) {
    const k = monthKey(c.createdAt);
    churnByMonth.set(k, (churnByMonth.get(k) ?? 0) + 1);
  }

  const out: AthletesByMonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(now, i);
    const k = monthKey(d);
    out.push({
      month: k,
      newAthletes: newByMonth.get(k) ?? 0,
      churnedMemberships: churnByMonth.get(k) ?? 0,
    });
  }
  return out;
}
