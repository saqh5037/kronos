"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import {
  buildCapabilityBuckets,
  pickWeakestStrongest,
  type Capability,
} from "@/lib/analytics/capability";
import { computePercentile } from "@/lib/analytics/percentile";
import { getCachedBoxMovementStats } from "@/server/cache";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type CapabilityCategoryResult = {
  category: Capability;
  name: string;
  score: number;
  rawValue: number;
  movementCount: number;
};

export type CapabilityProfile = {
  categories: CapabilityCategoryResult[];
  overallRank: number;
  totalAthletes: number;
  weakestCategory: string | null;
  strongestCategory: string | null;
};

/**
 * Capability profile (radar chart) for an athlete.
 *
 * Performance: O(PRs del atleta) + lectura de cache del box.
 * El cache `getCachedBoxMovementStats` (TTL 15 min) provee boxMaxByMovement
 * y overallScores sin releer todos los PRs del box en cada render.
 */
export async function getAthleteCapabilityProfile(
  athleteId: string,
): Promise<CapabilityProfile> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const [myPRs, boxStats] = await Promise.all([
    db.pR.findMany({
      where: { athleteId },
      select: {
        movementId: true,
        value: true,
        movement: { select: { name: true } },
      },
    }),
    getCachedBoxMovementStats(tenantId),
  ]);

  const boxMaxByMovement = new Map<string, number>(
    Object.entries(boxStats.byMovement).map(([id, e]) => [id, e.max]),
  );

  const myBuckets = buildCapabilityBuckets({
    myPRs: myPRs.map((p) => ({
      movementId: p.movementId,
      movementName: p.movement.name,
      value: Number(p.value),
    })),
    boxMaxByMovement,
  });

  const overallScores = boxStats.overallScores;
  const myOverall = boxStats.overallByAthlete[athleteId] ?? 0;

  // If athlete has no PRs at all, they're not in the ranking pool.
  const totalAthletes = overallScores.length;
  const rankInfo =
    myPRs.length === 0 || totalAthletes === 0
      ? { rank: 0, total: totalAthletes }
      : computePercentile(overallScores, myOverall, false);

  const { weakest, strongest } = pickWeakestStrongest(myBuckets);

  return {
    categories: myBuckets.map((b) => ({
      category: b.category,
      name: b.label,
      score: b.score,
      rawValue: b.rawValue,
      movementCount: b.movementCount,
    })),
    overallRank: rankInfo.rank,
    totalAthletes: rankInfo.total,
    weakestCategory: weakest,
    strongestCategory: strongest,
  };
}

export async function getMyCapabilityProfile(): Promise<CapabilityProfile> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
  });
  if (!me) {
    return {
      categories: buildCapabilityBuckets({
        myPRs: [],
        boxMaxByMovement: new Map(),
      }).map((b) => ({
        category: b.category,
        name: b.label,
        score: 0,
        rawValue: 0,
        movementCount: 0,
      })),
      overallRank: 0,
      totalAthletes: 0,
      weakestCategory: null,
      strongestCategory: null,
    };
  }
  return getAthleteCapabilityProfile(me.id);
}
