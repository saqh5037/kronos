"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import { buildFeedEvents, type FeedEvent } from "@/lib/feed/build";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

/**
 * Box-wide activity feed. Merges PR attempts, achievements, streak
 * milestones and "first score" moments into one chronological stream.
 *
 * Pure read. Builds entirely from data already captured by other flows —
 * no extra schema, no social model.
 */
export async function getBoxFeed(opts?: {
  limit?: number;
  since?: Date | string;
}): Promise<FeedEvent[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const limit = Math.min(opts?.limit ?? 50, 200);
  const since = opts?.since
    ? typeof opts.since === "string"
      ? new Date(opts.since)
      : opts.since
    : new Date(Date.now() - 30 * 86400000);

  const [prAttempts, achievements, streaks, scoresSeed] = await Promise.all([
    db.pRAttempt.findMany({
      where: { achievedAt: { gte: since } },
      orderBy: { achievedAt: "desc" },
      take: limit * 2,
      select: {
        achievedAt: true,
        value: true,
        prevBest: true,
        unit: true,
        scoreId: true,
        athlete: {
          select: { id: true, firstName: true, lastName: true },
        },
        movement: { select: { name: true } },
      },
    }),
    db.achievement.findMany({
      where: { earnedAt: { gte: since } },
      orderBy: { earnedAt: "desc" },
      take: limit,
      select: {
        earnedAt: true,
        athlete: {
          select: { id: true, firstName: true, lastName: true },
        },
        badge: { select: { code: true, name: true } },
      },
    }),
    db.streak.findMany({
      where: { lastEventAt: { gte: since }, count: { gte: 7 } },
      orderBy: { lastEventAt: "desc" },
      take: limit,
      select: {
        type: true,
        count: true,
        lastEventAt: true,
        athlete: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    }),
    db.score.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: limit * 2,
      select: {
        id: true,
        createdAt: true,
        athleteId: true,
        athlete: {
          select: { id: true, firstName: true, lastName: true },
        },
        wod: { select: { name: true } },
      },
    }),
  ]);

  // Compute "first score ever" for each athlete in the result window.
  const candidateAthletes = new Set(scoresSeed.map((s) => s.athleteId));
  const firstByAthlete = new Map<string, Date>();
  if (candidateAthletes.size > 0) {
    const firstRows = await db.score.groupBy({
      by: ["athleteId"],
      where: { athleteId: { in: Array.from(candidateAthletes) } },
      _min: { createdAt: true },
    });
    for (const r of firstRows) {
      if (r._min.createdAt) firstByAthlete.set(r.athleteId, r._min.createdAt);
    }
  }

  const merged = buildFeedEvents({
    prs: prAttempts.map((p) => ({
      athleteId: p.athlete.id,
      athleteName: `${p.athlete.firstName} ${p.athlete.lastName}`,
      achievedAt: p.achievedAt,
      movementName: p.movement.name,
      value: Number(p.value),
      unit: p.unit,
      prevBest: p.prevBest === null ? null : Number(p.prevBest),
      scoreId: p.scoreId,
    })),
    badges: achievements.map((a) => ({
      athleteId: a.athlete.id,
      athleteName: `${a.athlete.firstName} ${a.athlete.lastName}`,
      earnedAt: a.earnedAt,
      badgeCode: a.badge.code,
      badgeName: a.badge.name,
    })),
    streaks: streaks
      .filter((s) => s.lastEventAt !== null)
      .map((s) => ({
        athleteId: s.athlete.id,
        athleteName: `${s.athlete.firstName} ${s.athlete.lastName}`,
        lastEventAt: s.lastEventAt as Date,
        count: s.count,
        streakType: s.type as "ATTENDANCE" | "PR",
      })),
    firstScores: scoresSeed.map((s) => ({
      athleteId: s.athlete.id,
      athleteName: `${s.athlete.firstName} ${s.athlete.lastName}`,
      createdAt: s.createdAt,
      wodName: s.wod.name,
      scoreId: s.id,
      isFirstEver:
        firstByAthlete.get(s.athleteId)?.getTime() === s.createdAt.getTime(),
    })),
  });

  return merged.slice(0, limit);
}

export async function getAthleteFeed(
  athleteId: string,
  limit = 30,
): Promise<FeedEvent[]> {
  const all = await getBoxFeed({ limit: 200 });
  return all.filter((e) => e.athleteId === athleteId).slice(0, limit);
}

export async function getMyFeed(limit = 30): Promise<FeedEvent[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
  });
  if (!me) return [];
  return getAthleteFeed(me.id, limit);
}
