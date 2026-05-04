"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import { getTodayStats, type DayStats } from "./attendance";
import { listAvailableClasses, type AvailableClass } from "./bookings";

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

export async function getDashboardData(): Promise<DashboardData> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);
  const weekAhead = new Date(dayStart.getTime() + 7 * MS_PER_DAY);

  const [todayStats, nextClasses, todayPayments, expiring, waitlisted] =
    await Promise.all([
      getTodayStats(),
      listAvailableClasses(2),
      db.payment.findMany({
        where: {
          status: "PAID",
          paidAt: { gte: dayStart, lt: dayEnd },
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
          startsAt: { gte: dayStart, lt: dayEnd },
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
