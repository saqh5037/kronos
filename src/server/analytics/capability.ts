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
 * For each of 5 categories (STRENGTH/OLYMPIC/CARDIO/GYMNASTIC/CORE) we
 * compute a 0-100 score by normalizing the athlete's PR per movement vs
 * the box max for that movement, then averaging within the category.
 *
 * `overallRank` is the athlete's position in the box on the sum of their
 * 5 category scores.
 */
export async function getAthleteCapabilityProfile(
  athleteId: string,
): Promise<CapabilityProfile> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const [myPRs, allPRs] = await Promise.all([
    db.pR.findMany({
      where: { athleteId },
      select: {
        movementId: true,
        value: true,
        movement: { select: { name: true } },
      },
    }),
    db.pR.findMany({
      select: {
        athleteId: true,
        movementId: true,
        value: true,
        movement: { select: { name: true } },
      },
    }),
  ]);

  // Box max per movement (used to normalize contributions).
  const boxMaxByMovement = new Map<string, number>();
  for (const pr of allPRs) {
    const v = Number(pr.value);
    const cur = boxMaxByMovement.get(pr.movementId);
    if (cur === undefined || v > cur) boxMaxByMovement.set(pr.movementId, v);
  }

  const myBuckets = buildCapabilityBuckets({
    myPRs: myPRs.map((p) => ({
      movementId: p.movementId,
      movementName: p.movement.name,
      value: Number(p.value),
    })),
    boxMaxByMovement,
  });

  // Compute every athlete's overall score (sum of 5 category scores) so
  // we can rank the target athlete.
  const allByAthlete = new Map<
    string,
    { movementId: string; movementName: string; value: number }[]
  >();
  for (const pr of allPRs) {
    const arr = allByAthlete.get(pr.athleteId) ?? [];
    arr.push({
      movementId: pr.movementId,
      movementName: pr.movement.name,
      value: Number(pr.value),
    });
    allByAthlete.set(pr.athleteId, arr);
  }

  const overallScores: number[] = [];
  let myOverall = 0;
  for (const [aid, prs] of allByAthlete) {
    const buckets = buildCapabilityBuckets({
      myPRs: prs,
      boxMaxByMovement,
    });
    const total = buckets.reduce((s, b) => s + b.score, 0);
    overallScores.push(total);
    if (aid === athleteId) myOverall = total;
  }

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
