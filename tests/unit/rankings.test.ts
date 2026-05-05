import { describe, it, expect } from "vitest";
import { computePercentile } from "../../src/lib/analytics/percentile";

describe("rankings — percentile edge cases", () => {
  it("rank is stable across duplicate values (ties don't push you back)", () => {
    // 3 athletes with 100 kg, target also 100 → rank 1 (no one strictly ahead).
    const r = computePercentile([100, 100, 100], 100);
    expect(r.rank).toBe(1);
  });

  it("rank counts strictly-ahead peers", () => {
    // I'm 80; peers 100, 95, 90 ahead; 70, 60 behind → rank 4
    const r = computePercentile([100, 95, 90, 80, 70, 60], 80);
    expect(r.rank).toBe(4);
  });

  it("lower-is-better: faster is better rank", () => {
    // I'm 180s, peers 200, 220 (slower) and 170 (faster). Rank = 2.
    const r = computePercentile([200, 220, 170, 180], 180, true);
    expect(r.rank).toBe(2);
  });

  it("only one entry → P100 (no peers)", () => {
    const r = computePercentile([85], 85);
    expect(r.percentile).toBe(100);
    expect(r.rank).toBe(1);
  });

  it("percentile rounds to integer", () => {
    // target 50; others {100, 90, 80, 70, 30}. Target beats only 30 → 1/5 = 20.
    const r = computePercentile([100, 90, 80, 70, 30, 50], 50);
    expect(r.percentile).toBe(20);
    expect(Number.isInteger(r.percentile)).toBe(true);
  });
});
