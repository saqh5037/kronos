"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import { computePercentile } from "@/lib/analytics/percentile";
import { getCachedBoxMovementStats } from "@/server/cache";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type MovementRanking = {
  movementId: string;
  movementName: string;
  myValue: number;
  unit: string;
  percentile: number;
  rank: number;
  total: number;
  achievedAt: Date;
};

/**
 * Per-movement rankings for an athlete: for each movement they have a PR
 * on, compute their percentile and rank among all athletes with a PR for
 * that movement in the box.
 *
 * Performance: O(PRs del atleta) + lectura de cache del box.
 * El cache `getCachedBoxMovementStats` (TTL 15 min) provee los values por
 * movimiento sin releer todos los PRs del box en cada render.
 *
 * Returns sorted by percentile desc (their best showings first).
 */
export async function getAthleteMovementRankings(
  athleteId: string,
  limit = 8,
): Promise<MovementRanking[]> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const [myPRs, boxStats] = await Promise.all([
    db.pR.findMany({
      where: { athleteId },
      select: {
        movementId: true,
        value: true,
        unit: true,
        achievedAt: true,
        movement: { select: { name: true } },
      },
    }),
    getCachedBoxMovementStats(tenantId),
  ]);

  if (myPRs.length === 0) return [];

  const rankings: MovementRanking[] = myPRs.map((p) => {
    const entry = boxStats.byMovement[p.movementId];
    const peers = entry?.values ?? [];
    const myValue = Number(p.value);
    const r = computePercentile(peers, myValue, false);
    return {
      movementId: p.movementId,
      movementName: p.movement.name,
      myValue,
      unit: p.unit,
      percentile: r.percentile,
      rank: r.rank,
      total: r.total,
      achievedAt: p.achievedAt,
    };
  });

  return rankings.sort((a, b) => b.percentile - a.percentile).slice(0, limit);
}

export async function getMyMovementRankings(
  limit = 8,
): Promise<MovementRanking[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
  });
  if (!me) return [];
  return getAthleteMovementRankings(me.id, limit);
}

export type WODPercentileForMe = {
  wodId: string;
  myBest: number | null;
  percentile: number | null;
  rank: number | null;
  total: number;
};

/**
 * Returns the percentile of the current athlete in a WOD without re-running
 * the full leaderboard. Designed to enrich `getWODLeaderboard` callers.
 *
 * Uses groupBy to get best-per-athlete at DB level (O(1 row/atleta) vs
 * O(all scores)) — see getMyWODPercentile in scores.ts for the same pattern.
 *
 * Caller is responsible for the cohort: this only considers RX/RXPLUS
 * scores (matches the leaderboard convention).
 */
export async function getMyWODRanking(
  wodId: string,
): Promise<WODPercentileForMe | null> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
  });
  if (!me) return null;

  const wod = await db.wOD.findUnique({
    where: { id: wodId },
    select: { scoreType: true },
  });
  if (!wod) return null;

  const scores = await db.score.findMany({
    where: { wodId, scaling: { not: "SCALED" } },
    select: { athleteId: true, value: true },
  });

  const bestByAthlete = new Map<string, number>();
  const lowerIsBetter = wod.scoreType === "TIME";
  for (const s of scores) {
    const v = Number(s.value);
    const existing = bestByAthlete.get(s.athleteId);
    if (
      existing === undefined ||
      (lowerIsBetter ? v < existing : v > existing)
    ) {
      bestByAthlete.set(s.athleteId, v);
    }
  }

  const myBest = bestByAthlete.get(me.id) ?? null;
  if (myBest === null) {
    return {
      wodId,
      myBest: null,
      percentile: null,
      rank: null,
      total: bestByAthlete.size,
    };
  }

  const r = computePercentile(
    Array.from(bestByAthlete.values()),
    myBest,
    lowerIsBetter,
  );
  return {
    wodId,
    myBest,
    percentile: r.percentile,
    rank: r.rank,
    total: r.total,
  };
}
