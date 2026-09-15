"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import { getTodayStats, type DayStats } from "./attendance";
import { listAvailableClasses, type AvailableClass } from "./bookings";
import {
  dayKeyInTz,
  getBoxPeriodTimezone,
  getPeriodSummary,
  type PeriodInput,
  type PeriodSummary,
} from "../period-summary";
import { localDayWindow } from "@/lib/wod-date";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type ExpiringMembership = {
  id: string;
  athleteName: string;
  planName: string;
  endDate: Date;
};

export type DashboardData = {
  todayStats: DayStats;
  nextClasses: AvailableClass[];
  todayRevenue: number;
  todayPaymentsCount: number;
  expiringMemberships: ExpiringMembership[];
  waitlistedClassesToday: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function getDashboardData(
  opts?: PeriodInput,
): Promise<DashboardData> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);
  const tz = opts?.tz ?? (await getBoxPeriodTimezone(tenantId));

  // Today's window in the BOX timezone, so a 20:30 CDMX payment is not
  // counted toward tomorrow on a UTC server.
  const { start: dayStart, end: dayEnd } = localDayWindow(
    dayKeyInTz(new Date(), tz),
    tz,
  );
  const weekAhead = new Date(dayStart.getTime() + 7 * MS_PER_DAY);

  const [todayStats, nextClasses, todayPayments, expiring, waitlisted] =
    await Promise.all([
      getTodayStats(),
      listAvailableClasses(2),
      db.payment.findMany({
        where: {
          status: "PAID",
          paidAt: { gte: dayStart, lte: dayEnd },
        },
        select: { amount: true },
      }),
      db.membership.findMany({
        where: {
          status: "ACTIVE",
          endDate: { gte: dayStart, lte: weekAhead },
        },
        orderBy: { endDate: "asc" },
        take: 10,
        include: {
          athlete: { select: { firstName: true, lastName: true } },
          plan: { select: { name: true } },
        },
      }),
      db.class.count({
        where: {
          startsAt: { gte: dayStart, lte: dayEnd },
          isActive: true,
          bookings: { some: { status: "WAITLIST" } },
        },
      }),
    ]);

  return {
    todayStats,
    nextClasses: nextClasses.slice(0, 5),
    todayRevenue: todayPayments.reduce((acc, p) => acc + Number(p.amount), 0),
    todayPaymentsCount: todayPayments.length,
    expiringMemberships: expiring
      .filter((m) => m.endDate !== null)
      .map((m) => ({
        id: m.id,
        athleteName: `${m.athlete.firstName} ${m.athlete.lastName}`,
        planName: m.plan.name,
        endDate: m.endDate as Date,
      })),
    waitlistedClassesToday: waitlisted,
  };
}

/**
 * The ONE period summary every owner-dashboard KPI must read.
 *
 * Use `summary.athletes.active` for "atletas activos" — the dashboard used
 * to print seats booked today (27) while /admin/atletas printed 42 — and
 * `summary.athletes.atRisk` for "en riesgo", which is now the same number
 * Atletas and Reportes show. `summary.revenue` feeds the MRR tile and its
 * delta, `summary.payments.byDay` / `summary.attendance.byDay` feed the two
 * charts (one point per day of the selected range, so the x-axis can no
 * longer show April), and `summary.period.label` is the label the range chip
 * and both chart headers must render.
 *
 * Pass the SAME `{ preset }` or `{ from, to }` the range control shows, and
 * pass it to every other action on the page: the summary is memoised per
 * request, so a page that asks for one window queries the database once.
 */
export async function getDashboardSummary(
  opts?: PeriodInput,
): Promise<PeriodSummary> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const tz = opts?.tz ?? (await getBoxPeriodTimezone(tenantId));
  return getPeriodSummary(tenantId, {
    preset: opts?.preset,
    from: opts?.from,
    to: opts?.to,
    tz,
  });
}
