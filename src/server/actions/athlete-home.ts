"use server";

import { requireCachedSession } from "@/server/session";
import { getCurrentAthleteCached } from "./athlete-cache";
import { withTenant } from "../db";
import { subDays, startOfDay } from "date-fns";
import { pickSuggestedClass, type Suggestion } from "@/lib/booking-suggestion";
import { listAvailableClasses, getAthleteUsualSlots } from "./bookings";
import { attendanceDayOf, streakFromBookings } from "@/lib/streak";
import { getBoxTimezone } from "@/server/cache";
import {
  heatmapDayBuckets,
  heatmapRangeKeys,
  type HeatmapDayBucket,
} from "@/lib/analytics/attendance-heatmap";
import { reconcileBadgeXPLedger } from "@/server/achievements/xp";

/** How far back the streak may reach. Bounds the query without capping a real streak. */
const STREAK_LOOKBACK_DAYS = 400;
const HEATMAP_DAYS = 90;

async function requireSession() {
  return requireCachedSession();
}

export type MyAttendance90d = {
  /** One entry per local calendar day the athlete trained, ascending. */
  buckets: HeatmapDayBucket[];
  /** Window bounds as day keys in the box timezone. */
  fromKey: string;
  toKey: string;
};

/**
 * The days the athlete trained in the last 90, bucketed in the box timezone.
 *
 * Audit 2026-09-15 (P1): this required `checkedInAt != null` and dated by it,
 * while the streak counted `status: ATTENDED` dated by `class.startsAt`. A
 * booking a coach marks attended from the roster has no `checkedInAt`, so the
 * heatmap lit 4 cells against a 7-day streak and a 17-class header. Both paths
 * now agree, through `attendanceDayOf`.
 */
export async function getMyAttendanceLast90d(): Promise<MyAttendance90d> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const now = new Date();

  const me = await getCurrentAthleteCached();
  if (!me) {
    const empty = heatmapRangeKeys(now, null, HEATMAP_DAYS);
    return { buckets: [], fromKey: empty.fromKey, toKey: empty.toKey };
  }

  const cutoff = startOfDay(subDays(now, HEATMAP_DAYS));

  const [bookings, timezone] = await Promise.all([
    db.booking.findMany({
      where: {
        athleteId: me.id,
        status: "ATTENDED",
        class: { startsAt: { gte: cutoff } },
      },
      select: { checkedInAt: true, class: { select: { startsAt: true } } },
    }),
    getBoxTimezone(tenantId).catch(() => null),
  ]);

  const instants = bookings
    .map(attendanceDayOf)
    .filter((d): d is Date => d !== null);

  const { fromKey, toKey } = heatmapRangeKeys(now, timezone, HEATMAP_DAYS);
  return { buckets: heatmapDayBuckets(instants, timezone), fromKey, toKey };
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

  const me = await getCurrentAthleteCached();
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
  athlete: { id: string; firstName: string; lastName: string | null } | null;
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

  const me = await getCurrentAthleteCached();
  if (!me) return null;

  const now = new Date();
  const weekStart = new Date(now);
  const dow = weekStart.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  weekStart.setDate(weekStart.getDate() + offset);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [
    streak,
    attendedBookings,
    weekAttended,
    nextBookingRaw,
    lastScore,
    prCount,
    xpTotal,
  ] = await Promise.all([
    db.streak.findFirst({
      where: { athleteId: me.id, type: "ATTENDANCE" },
    }),
    // Raw rows, because the cached `Streak.count` is only written on
    // check-in: an athlete the coach marks attended from the roster kept a
    // stale count (audit 2026-09-15 — a 30-day badge read 0 % on day 7).
    db.booking.findMany({
      where: {
        athleteId: me.id,
        status: "ATTENDED",
        class: {
          startsAt: { gte: startOfDay(subDays(now, STREAK_LOOKBACK_DAYS)) },
        },
      },
      select: { checkedInAt: true, class: { select: { startsAt: true } } },
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
    // The SAME number `/atleta/logros` shows: the ledger sum, after
    // back-filling the rows badges unlocked outside `runAchievementEvaluation`
    // never got. Reading the raw aggregate here is what printed
    // "LOGROS · 0 XP" above four unlocked badges (audit 2026-09-15, S10).
    reconcileBadgeXPLedger(tenantId, me.id).catch(() => 0),
  ]);

  // Recomputed from the bookings rather than read off `Streak.count`. When the
  // two disagree the rows are right: the cache is only written on check-in, so
  // it both goes stale upward (athlete stopped attending) and lags downward
  // (coach marked the roster). `streakFromBookings` already applies the 1-day
  // grace that `isStreakCurrent` used to apply to the cached value.
  const currentStreak = streakFromBookings(attendedBookings, now);
  const lastAttendanceAt = attendedBookings
    .map(attendanceDayOf)
    .filter((d): d is Date => d !== null)
    .reduce<Date | null>(
      (latest, d) => (latest === null || d > latest ? d : latest),
      null,
    );
  const streakLastEventAt = lastAttendanceAt ?? streak?.lastEventAt ?? null;

  return {
    athlete: me,
    streak: currentStreak,
    streakLastEventAt,
    xpTotal,
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

  const me = await getCurrentAthleteCached();
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

  const me = await getCurrentAthleteCached();
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
