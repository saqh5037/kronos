"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import type { PlanType } from "@/lib/validations/membership";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type Reports = {
  generatedAt: Date;
  // Headline KPIs (current month)
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

  // Activity
  monthScores: number;
  monthPRs: number;

  // Top lists
  topWODs: { wodId: string; name: string; scoreCount: number }[];
  topAttendees: { athleteName: string; attendedCount: number }[];

  // Plan distribution
  planDistribution: { type: PlanType; count: number; revenue: number }[];
};

export async function getReports(): Promise<Reports> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = monthStart;

  const [
    paidThisMonth,
    paidLastMonth,
    activeMemberships,
    classesHeld,
    bookingsThisMonth,
    activeAthletesCount,
    pausedAthletesCount,
    newAthletes,
    churnedMemberships,
    scoresThisMonth,
    prsThisMonth,
    topWODsRaw,
    topAttendeesRaw,
    planGrouping,
  ] = await Promise.all([
    db.payment.findMany({
      where: { status: "PAID", paidAt: { gte: monthStart, lt: monthEnd } },
      select: { amount: true },
    }),
    db.payment.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: prevMonthStart, lt: prevMonthEnd },
      },
      select: { amount: true },
    }),
    db.membership.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true },
    }),
    db.class.count({
      where: {
        startsAt: { gte: monthStart, lt: monthEnd },
        isActive: true,
      },
    }),
    db.booking.findMany({
      where: {
        class: { startsAt: { gte: monthStart, lt: monthEnd } },
      },
      select: { status: true },
    }),
    db.athlete.count({ where: { status: "ACTIVE" } }),
    db.athlete.count({ where: { status: "PAUSED" } }),
    db.athlete.count({
      where: { createdAt: { gte: monthStart, lt: monthEnd } },
    }),
    db.membership.count({
      where: {
        status: "CANCELLED",
        // Use createdAt as proxy — schema has no cancelledAt yet
        // Future: add cancelledAt field for real churn tracking
      },
    }),
    db.score.count({
      where: { createdAt: { gte: monthStart, lt: monthEnd } },
    }),
    db.pR.count({
      where: { achievedAt: { gte: monthStart, lt: monthEnd } },
    }),
    db.score.groupBy({
      by: ["wodId"],
      where: { createdAt: { gte: monthStart, lt: monthEnd } },
      _count: { _all: true },
      orderBy: { _count: { wodId: "desc" } },
      take: 5,
    }),
    db.booking.groupBy({
      by: ["athleteId"],
      where: {
        status: "ATTENDED",
        class: { startsAt: { gte: monthStart, lt: monthEnd } },
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

  const monthRevenue = paidThisMonth.reduce(
    (acc, p) => acc + Number(p.amount),
    0,
  );
  const prevMonthRevenue = paidLastMonth.reduce(
    (acc, p) => acc + Number(p.amount),
    0,
  );
  const revenueDelta =
    prevMonthRevenue === 0
      ? 0
      : (monthRevenue - prevMonthRevenue) / prevMonthRevenue;

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

  const monthBookings = bookingsThisMonth.length;
  const monthAttended = bookingsThisMonth.filter(
    (b) => b.status === "ATTENDED",
  ).length;
  const monthNoShow = bookingsThisMonth.filter(
    (b) => b.status === "NOSHOW",
  ).length;
  const denom = monthAttended + monthNoShow;
  const attendanceRate = denom === 0 ? 0 : monthAttended / denom;

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
    monthScores: scoresThisMonth,
    monthPRs: prsThisMonth,
    topWODs,
    topAttendees,
    planDistribution,
  };
}
