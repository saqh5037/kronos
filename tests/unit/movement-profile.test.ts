import { describe, it, expect } from "vitest";
import { computePercentile } from "../../src/lib/analytics/percentile";
import { buildMovementProfile } from "../../src/lib/analytics/movement-profile";

describe("computePercentile", () => {
  it("higher-is-better: top performer is P100", () => {
    const r = computePercentile([60, 70, 80, 90, 100], 100);
    expect(r.percentile).toBe(100);
    expect(r.rank).toBe(1);
    expect(r.total).toBe(5);
  });

  it("higher-is-better: median is around P50", () => {
    const r = computePercentile([60, 70, 80, 90, 100], 80);
    expect(r.percentile).toBe(50); // beats 2 of 4 others
    expect(r.rank).toBe(3);
  });

  it("lower-is-better (TIME): fastest is P100", () => {
    const r = computePercentile([180, 200, 220, 240], 180, true);
    expect(r.percentile).toBe(100);
    expect(r.rank).toBe(1);
  });

  it("ties: shared value share the same rank (rank = ahead + 1)", () => {
    const r = computePercentile([100, 100, 100, 90], 100);
    expect(r.rank).toBe(1);
  });

  it("empty box returns zeroes", () => {
    const r = computePercentile([], 100);
    expect(r.total).toBe(0);
    expect(r.rank).toBe(0);
  });

  it("single athlete is P100 (no peers to compare)", () => {
    const r = computePercentile([100], 100);
    expect(r.percentile).toBe(100);
  });
});

describe("buildMovementProfile", () => {
  const baseDate = new Date("2026-05-04T12:00:00.000Z").toISOString();

  it("returns nulls when there are no PR attempts", () => {
    const p = buildMovementProfile({
      attempts: [],
      boxCurrentBests: [80, 100, 120],
      scoresInWindow: [],
    });
    expect(p.lastPR).toBeNull();
    expect(p.currentBest).toBeNull();
    expect(p.frequency90d).toBe(0);
    expect(p.isStale).toBe(false); // no attempts ≠ stale
  });

  it("computes frequency from scoresInWindow", () => {
    const p = buildMovementProfile({
      attempts: [{ achievedAt: baseDate, value: 100 }],
      boxCurrentBests: [100],
      scoresInWindow: [
        { date: baseDate },
        { date: baseDate },
        { date: baseDate },
      ],
    });
    expect(p.frequency90d).toBe(3);
  });

  it("flags stale when last PR is older than threshold", () => {
    // 60 days ago
    const old = new Date();
    old.setDate(old.getDate() - 60);
    const p = buildMovementProfile({
      attempts: [{ achievedAt: old, value: 100 }],
      boxCurrentBests: [100],
      scoresInWindow: [],
      staleThresholdDays: 30,
    });
    expect(p.isStale).toBe(true);
  });

  it("ranks athlete vs box current bests", () => {
    const p = buildMovementProfile({
      attempts: [{ achievedAt: baseDate, value: 120 }],
      boxCurrentBests: [80, 100, 120, 90, 70],
      scoresInWindow: [],
    });
    expect(p.currentBest).toBe(120);
    expect(p.rankInBox).toBe(1);
    expect(p.totalAthletesInBox).toBe(5);
    expect(p.percentileInBox).toBeGreaterThan(50);
  });

  it("progression preserves chronological order from attempts", () => {
    const p = buildMovementProfile({
      attempts: [
        { achievedAt: "2026-01-01T00:00:00.000Z", value: 80 },
        { achievedAt: "2026-03-01T00:00:00.000Z", value: 100 },
        { achievedAt: "2026-02-01T00:00:00.000Z", value: 90 },
      ],
      boxCurrentBests: [100],
      scoresInWindow: [],
    });
    expect(p.progression.map((x) => x.value)).toEqual([80, 90, 100]);
    expect(p.progression[2].isCurrentBest).toBe(true);
  });
});
