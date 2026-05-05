"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import {
  buildMovementProfile,
  type MovementProfile,
} from "@/lib/analytics/movement-profile";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type AthleteMovementProfile = MovementProfile & {
  movementId: string;
  movementName: string;
  unit: string | null;
};

/**
 * Full profile for one athlete on one movement: frequency, last PR,
 * days since, progression, percentile/rank in the box, stale flag.
 *
 * Designed to feed a single "Movement Profile" card with a sparkline.
 */
export async function getAthleteMovementProfile(
  athleteId: string,
  movementId: string,
): Promise<AthleteMovementProfile | null> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [movement, attempts, scoresInWindow, boxBests, myPR] =
    await Promise.all([
      db.movement.findUnique({
        where: { id: movementId },
        select: { id: true, name: true },
      }),
      db.pRAttempt.findMany({
        where: { athleteId, movementId },
        orderBy: { achievedAt: "asc" },
        select: { achievedAt: true, value: true, prevBest: true },
      }),
      // Scores in window where this WOD includes this movement
      db.score.findMany({
        where: {
          athleteId,
          createdAt: { gte: ninetyDaysAgo },
          wod: { movements: { some: { movementId } } },
        },
        select: { createdAt: true },
      }),
      db.pR.findMany({
        where: { movementId },
        select: { value: true },
      }),
      db.pR.findFirst({
        where: { athleteId, movementId },
        select: { unit: true },
      }),
    ]);

  if (!movement) return null;

  const profile = buildMovementProfile({
    attempts: attempts.map((a) => ({
      achievedAt: a.achievedAt,
      value: Number(a.value),
      prevBest: a.prevBest === null ? null : Number(a.prevBest),
    })),
    boxCurrentBests: boxBests.map((b) => Number(b.value)),
    scoresInWindow: scoresInWindow.map((s) => ({ date: s.createdAt })),
  });

  return {
    movementId: movement.id,
    movementName: movement.name,
    unit: myPR?.unit ?? null,
    ...profile,
  };
}

export type RankedMovement = {
  movementId: string;
  movementName: string;
  frequency90d: number;
  daysSinceLastAttempt: number | null;
  isStale: boolean;
  currentBest: number | null;
  unit: string | null;
};

/**
 * Top movements an athlete has trained in the last 90 days, sorted by
 * frequency desc. Each entry includes a stale flag (>30d since last PR)
 * for at-a-glance "what needs focus" lists.
 */
export async function listAthleteMovementsRanked(
  athleteId: string,
  limit = 10,
): Promise<RankedMovement[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const scores = await db.score.findMany({
    where: { athleteId, createdAt: { gte: ninetyDaysAgo } },
    select: {
      createdAt: true,
      wod: {
        select: {
          movements: {
            select: {
              movementId: true,
              movement: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  const freq = new Map<string, { name: string; count: number }>();
  for (const s of scores) {
    for (const m of s.wod.movements) {
      const acc = freq.get(m.movementId);
      if (acc) {
        acc.count += 1;
      } else {
        freq.set(m.movementId, { name: m.movement.name, count: 1 });
      }
    }
  }

  const movementIds = Array.from(freq.keys());
  if (movementIds.length === 0) return [];

  const prs = await db.pR.findMany({
    where: { athleteId, movementId: { in: movementIds } },
    select: {
      movementId: true,
      value: true,
      unit: true,
      achievedAt: true,
    },
  });
  const prByMovement = new Map(prs.map((p) => [p.movementId, p]));

  const now = new Date();
  const out: RankedMovement[] = movementIds.map((id) => {
    const f = freq.get(id)!;
    const pr = prByMovement.get(id);
    const days =
      pr === undefined
        ? null
        : Math.floor((now.getTime() - pr.achievedAt.getTime()) / 86400000);
    return {
      movementId: id,
      movementName: f.name,
      frequency90d: f.count,
      daysSinceLastAttempt: days,
      isStale: days !== null && days >= 30,
      currentBest: pr ? Number(pr.value) : null,
      unit: pr ? pr.unit : null,
    };
  });

  return out.sort((a, b) => b.frequency90d - a.frequency90d).slice(0, limit);
}

/**
 * Convenience: profile for the currently signed-in athlete.
 */
export async function getMyMovementProfile(
  movementId: string,
): Promise<AthleteMovementProfile | null> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
  });
  if (!me) return null;
  return getAthleteMovementProfile(me.id, movementId);
}

export async function listMyMovementsRanked(
  limit = 10,
): Promise<RankedMovement[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
  });
  if (!me) return [];
  return listAthleteMovementsRanked(me.id, limit);
}

/** Alias of {@link listMyMovementsRanked}. Kept because the UI handoff
 *  doc referenced the name `listMyMovementsRated`. Both names point to the
 *  same implementation; either is safe to call. */
export async function listMyMovementsRated(
  limit = 10,
): Promise<RankedMovement[]> {
  return listMyMovementsRanked(limit);
}
