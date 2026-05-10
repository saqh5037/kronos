"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import { subDays, startOfDay } from "date-fns";
import { pickSuggestedClass, type Suggestion } from "@/lib/booking-suggestion";
import { listAvailableClasses, getAthleteUsualSlots } from "./bookings";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type MyAttendanceDay = { date: Date };

export async function getMyAttendanceLast90d(): Promise<MyAttendanceDay[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!me) return [];

  const cutoff = startOfDay(subDays(new Date(), 90));

  const bookings = await db.booking.findMany({
    where: {
      athleteId: me.id,
      status: "ATTENDED",
      checkedInAt: { gte: cutoff, not: null },
    },
    select: { checkedInAt: true },
  });

  return bookings
    .filter((b) => b.checkedInAt !== null)
    .map((b) => ({ date: b.checkedInAt as Date }));
}

export type MyScoreTimelinePoint = {
  date: string;
  value: number;
  wodName: string;
};

export async function getMyScoresTimeline(
  days: number = 90,
): Promise<MyScoreTimelinePoint[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!me) return [];

  const cutoff = startOfDay(subDays(new Date(), days));

  const scores = await db.score.findMany({
    where: { athleteId: me.id, createdAt: { gte: cutoff } },
    orderBy: { createdAt: "asc" },
    include: { wod: { select: { name: true } } },
  });

  return scores.map((s) => ({
    date: s.createdAt.toISOString().slice(0, 10),
    value: Number(s.value),
    wodName: s.wod.name,
  }));
}

export type AthleteHome = {
  athlete: { id: string; firstName: string; lastName: string } | null;
  streak: number;
  streakLastEventAt: Date | null;
  xpTotal: number;
  weekAttendance: number; // ATTENDED count this week
  weekGoal: number; // capacity goal (default 5)
  nextBooking: {
    bookingId: string;
    classId: string;
    startsAt: Date;
    wodName: string | null;
    coachName: string | null;
    status: string;
  } | null;
  lastScore: {
    wodName: string;
    value: number;
    unit: string;
    scoreType: string;
    createdAt: Date;
  } | null;
  prCount: number;
} | null;

export async function getAthleteHome(): Promise<AthleteHome> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!me) return null;

  const now = new Date();
  const weekStart = new Date(now);
  const dow = weekStart.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  weekStart.setDate(weekStart.getDate() + offset);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [streak, weekAttended, nextBookingRaw, lastScore, prCount, xpAgg] =
    await Promise.all([
      db.streak.findFirst({
        where: { athleteId: me.id, type: "ATTENDANCE" },
      }),
      db.booking.count({
        where: {
          athleteId: me.id,
          status: "ATTENDED",
          class: { startsAt: { gte: weekStart, lt: weekEnd } },
        },
      }),
      db.booking.findFirst({
        where: {
          athleteId: me.id,
          status: { in: ["BOOKED", "WAITLIST"] },
          class: { startsAt: { gte: now } },
        },
        orderBy: { class: { startsAt: "asc" } },
        include: {
          class: {
            include: {
              wod: { select: { name: true } },
              coach: { select: { name: true } },
            },
          },
        },
      }),
      db.score.findFirst({
        where: { athleteId: me.id },
        orderBy: { createdAt: "desc" },
        include: { wod: { select: { name: true, scoreType: true } } },
      }),
      db.pR.count({ where: { athleteId: me.id } }),
      db.xPLedger.aggregate({
        where: { athleteId: me.id, tenantId },
        _sum: { amount: true },
      }),
    ]);

  return {
    athlete: me,
    streak: streak?.count ?? 0,
    streakLastEventAt: streak?.lastEventAt ?? null,
    xpTotal: xpAgg._sum.amount ?? 0,
    weekAttendance: weekAttended,
    weekGoal: 5,
    nextBooking: nextBookingRaw
      ? {
          bookingId: nextBookingRaw.id,
          classId: nextBookingRaw.classId,
          startsAt: nextBookingRaw.class.startsAt,
          wodName: nextBookingRaw.class.wod?.name ?? null,
          coachName: nextBookingRaw.class.coach?.name ?? null,
          status: nextBookingRaw.status,
        }
      : null,
    lastScore: lastScore
      ? {
          wodName: lastScore.wod.name,
          value: Number(lastScore.value),
          unit: lastScore.unit,
          scoreType: lastScore.wod.scoreType,
          createdAt: lastScore.createdAt,
        }
      : null,
    prCount,
  };
}

export type AthleteTrophy = {
  id: string;
  code: string;
  name: string;
  description: string;
  earnedAt: Date | null;
  unlocked: boolean;
  progress?: number;
};

export async function getAthleteTrophies(): Promise<AthleteTrophy[]> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!me) return [];

  const [badges, achievements] = await Promise.all([
    db.badge.findMany({ where: { tenantId }, orderBy: { code: "asc" } }),
    db.achievement.findMany({ where: { tenantId, athleteId: me.id } }),
  ]);

  const ownedMap = new Map(achievements.map((a) => [a.badgeId, a.earnedAt]));

  const items: AthleteTrophy[] = badges.map((b) => {
    const earnedAt = ownedMap.get(b.id) ?? null;
    return {
      id: b.id,
      code: b.code,
      name: b.name,
      description: b.description,
      earnedAt,
      unlocked: earnedAt !== null,
    };
  });

  // Sort: unlocked first (most recent earnedAt first), then locked.
  items.sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    if (a.unlocked && b.unlocked) {
      return (b.earnedAt?.getTime() ?? 0) - (a.earnedAt?.getTime() ?? 0);
    }
    return a.name.localeCompare(b.name);
  });

  return items;
}

export type FeaturedTrophy = {
  id: string;
  code: string;
  name: string;
  description: string;
  earnedAt: Date;
  isThisMonth: boolean;
};

export async function getMonthlyFeaturedTrophy(): Promise<FeaturedTrophy | null> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!me) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthly = await db.achievement.findFirst({
    where: { athleteId: me.id, tenantId, earnedAt: { gte: monthStart } },
    orderBy: { earnedAt: "desc" },
    include: { badge: true },
  });

  if (monthly) {
    return {
      id: monthly.badge.id,
      code: monthly.badge.code,
      name: monthly.badge.name,
      description: monthly.badge.description,
      earnedAt: monthly.earnedAt,
      isThisMonth: true,
    };
  }

  const fallback = await db.achievement.findFirst({
    where: { athleteId: me.id, tenantId },
    orderBy: { earnedAt: "desc" },
    include: { badge: true },
  });
  if (!fallback) return null;
  return {
    id: fallback.badge.id,
    code: fallback.badge.code,
    name: fallback.badge.name,
    description: fallback.badge.description,
    earnedAt: fallback.earnedAt,
    isThisMonth: false,
  };
}

export type SuggestedBooking = Suggestion;

export async function getSuggestedNextClass(): Promise<SuggestedBooking> {
  await requireSession();
  const [classes, usualSlots] = await Promise.all([
    listAvailableClasses(2),
    getAthleteUsualSlots(60).catch(() => []),
  ]);
  return pickSuggestedClass({
    classes: classes.map((c) => ({
      id: c.id,
      startsAt: c.startsAt,
      durationMin: c.durationMin,
      capacity: c.capacity,
      kind: c.kind,
      bookedCount: c.bookedCount,
      waitlistCount: c.waitlistCount,
      coach: c.coach,
      wod: c.wod,
      myBookingId: c.myBookingId,
    })),
    usualSlots,
    now: new Date(),
  });
}
