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
import {
  capabilityCategoriesView,
  capabilityCategoryName,
} from "@/lib/scores/capability-view";
import { getCachedBoxMovementStats } from "@/server/cache";

/**
 * `pickWeakestStrongest` returns the pure classifier's own label, which is
 * still "Olympic". Map it back through the Spanish table by matching on label.
 */
const LABEL_TO_CATEGORY: Record<string, string> = {
  Fuerza: "STRENGTH",
  Olympic: "OLYMPIC",
  Cardio: "CARDIO",
  "Gimnástico": "GYMNASTIC",
  Core: "CORE",
};

function capabilityLabelES(label: string): string {
  return capabilityCategoryName(LABEL_TO_CATEGORY[label] ?? label, label);
}

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type CapabilityCategoryResult = {
  category: Capability;
  /** Neutral Mexican Spanish label ("Olímpico", not "Olympic"). */
  name: string;
  /**
   * `null` when the athlete has no movements in this category.
   *
   * Audit 2026-09-15 (P1, /atleta/perfil): the radar showed "Cardio 0" and
   * "Core 0" with Helen, Karen and Fran on file, because
   * `buildCapabilityBuckets` short-circuits an empty bucket to `score: 0` —
   * indistinguishable from a genuinely bad category. Absent data is null here
   * and renders as "sin datos".
   */
  score: number | null;
  /** Ready-to-render: the rounded score, or "sin datos". */
  display: string;
  hasData: boolean;
  rawValue: number;
  movementCount: number;
};

export type CapabilityProfile = {
  categories: CapabilityCategoryResult[];
  /** `null` when the athlete is not in the ranking pool (no PRs, empty box). */
  overallRank: number | null;
  totalAthletes: number;
  weakestCategory: string | null;
  strongestCategory: string | null;
  /** True when at least one category has data — the UI hides the radar otherwise. */
  hasAnyData: boolean;
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
  const view = capabilityCategoriesView(myBuckets);

  return {
    categories: myBuckets.map((b, i) => ({
      category: b.category,
      name: view[i].name,
      score: view[i].score,
      display: view[i].display,
      hasData: view[i].hasData,
      rawValue: b.rawValue,
      movementCount: b.movementCount,
    })),
    overallRank: rankInfo.total > 0 && rankInfo.rank > 0 ? rankInfo.rank : null,
    totalAthletes: rankInfo.total,
    weakestCategory: weakest ? capabilityLabelES(weakest) : null,
    strongestCategory: strongest ? capabilityLabelES(strongest) : null,
    hasAnyData: view.some((c) => c.hasData),
  };
}

export async function getMyCapabilityProfile(): Promise<CapabilityProfile> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
  });
  if (!me) {
    const empty = buildCapabilityBuckets({
      myPRs: [],
      boxMaxByMovement: new Map(),
    });
    const view = capabilityCategoriesView(empty);
    return {
      categories: empty.map((b, i) => ({
        category: b.category,
        name: view[i].name,
        score: null,
        display: view[i].display,
        hasData: false,
        rawValue: 0,
        movementCount: 0,
      })),
      overallRank: null,
      totalAthletes: 0,
      weakestCategory: null,
      strongestCategory: null,
      hasAnyData: false,
    };
  }
  return getAthleteCapabilityProfile(me.id);
}
