/**
 * Absent capability data is `null`, never a fabricated 0 / rank 0.
 *
 * Audit 2026-09-15 (P1, `/atleta/perfil`): the radar plotted "Cardio 0" and
 * "Core 0" with Helen, Karen and Fran on file, and the header printed "#0 DE 0"
 * for an athlete with no PRs. Both numbers were invented by the primitives:
 * `buildCapabilityBuckets` divided by `movementCount` and short-circuited an
 * empty bucket to `score: 0`, and `computePercentile([], x)` returned
 * `rank: 0`. A zero is a MEASUREMENT — the same value a genuinely terrible
 * category earns — so absence has to be a different value.
 *
 * `src/lib/scores/capability-view.ts` already mapped the zeros back to null at
 * the presentation boundary. This pins the fix at the source, so a new caller
 * cannot re-import the lie.
 */
import { describe, it, expect } from "vitest";
import {
  buildCapabilityBuckets,
  pickWeakestStrongest,
} from "../../src/lib/analytics/capability";
import { computePercentile } from "../../src/lib/analytics/percentile";
import { buildMovementProfile } from "../../src/lib/analytics/movement-profile";
import { capabilityScoreLabel } from "../../src/lib/scores/copy";

describe("buildCapabilityBuckets — empty category", () => {
  it("scores an untouched category null, not 0", () => {
    const buckets = buildCapabilityBuckets({
      myPRs: [],
      boxMaxByMovement: new Map(),
    });
    expect(buckets).toHaveLength(5);
    for (const b of buckets) {
      expect(b.score, b.category).toBeNull();
      expect(b.movementCount).toBe(0);
    }
  });

  it("keeps a real 0 for a category that IS measured and scores 0", () => {
    // The athlete has a Back Squat on file, but the box max dwarfs it.
    const buckets = buildCapabilityBuckets({
      myPRs: [{ movementId: "m1", movementName: "Back Squat", value: 0.001 }],
      boxMaxByMovement: new Map([["m1", 1000]]),
    });
    const strength = buckets.find((b) => b.category === "STRENGTH")!;
    expect(strength.movementCount).toBe(1);
    expect(strength.score).toBe(0); // measured, and it is genuinely 0
    expect(strength.score).not.toBeNull();

    const cardio = buckets.find((b) => b.category === "CARDIO")!;
    expect(cardio.score).toBeNull(); // never trained, no score at all
  });

  it("renders null as 'sin datos' and a measured 0 as '0'", () => {
    expect(capabilityScoreLabel(null)).toBe("sin datos");
    expect(capabilityScoreLabel(0)).toBe("0");
  });

  it("still averages measured categories the same way", () => {
    const buckets = buildCapabilityBuckets({
      myPRs: [
        { movementId: "m1", movementName: "Back Squat", value: 100 },
        { movementId: "m2", movementName: "Deadlift", value: 150 },
      ],
      boxMaxByMovement: new Map([
        ["m1", 200],
        ["m2", 200],
      ]),
    });
    const strength = buckets.find((b) => b.category === "STRENGTH")!;
    expect(strength.score).toBe(62.5);
  });

  it("pickWeakestStrongest ignores the null categories", () => {
    const buckets = buildCapabilityBuckets({
      myPRs: [
        { movementId: "m1", movementName: "Back Squat", value: 180 },
        { movementId: "m2", movementName: "Snatch", value: 60 },
      ],
      boxMaxByMovement: new Map([
        ["m1", 200], // STRENGTH 90
        ["m2", 100], // OLYMPIC 60
      ]),
    });
    const r = pickWeakestStrongest(buckets);
    expect(r.strongest).toBe("Fuerza");
    expect(r.weakest).toBe("Olympic");
  });
});

describe("computePercentile — empty cohort", () => {
  it("has no rank and no percentile when there is nobody to compare against", () => {
    expect(computePercentile([], 100)).toEqual({
      percentile: null,
      rank: null,
      total: 0,
      betterThan: 0,
    });
  });

  it("ranks 1 of 1 for a lone athlete instead of collapsing to 0", () => {
    const r = computePercentile([85], 85);
    expect(r.rank).toBe(1);
    expect(r.total).toBe(1);
    expect(r.percentile).toBe(100);
  });

  it("is unchanged for a real cohort", () => {
    const r = computePercentile([100, 95, 90, 80, 70, 60], 80);
    expect(r.rank).toBe(4);
    expect(r.total).toBe(6);
  });
});

describe("buildMovementProfile — athlete with no attempts", () => {
  it("reports no rank instead of '#0 de 0'", () => {
    const profile = buildMovementProfile({
      attempts: [],
      boxCurrentBests: [100, 120, 140],
      scoresInWindow: [],
    });
    expect(profile.currentBest).toBeNull();
    expect(profile.rankInBox).toBeNull();
    expect(profile.percentileInBox).toBeNull();
    // The cohort itself is real and still worth showing.
    expect(profile.totalAthletesInBox).toBe(3);
  });
});
