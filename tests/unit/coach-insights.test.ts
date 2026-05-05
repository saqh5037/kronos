import { describe, it, expect } from "vitest";
import {
  detectStagnation,
  detectDecline,
  rankImprovers,
} from "../../src/lib/insights/detectors";

describe("detectStagnation", () => {
  it("not stagnant when athlete didn't train recently", () => {
    const r = detectStagnation({ daysSinceLastPR: 60, trainedRecently: false });
    expect(r.stagnant).toBe(false);
  });

  it("not stagnant when never PR'd (different signal)", () => {
    const r = detectStagnation({
      daysSinceLastPR: null,
      trainedRecently: true,
    });
    expect(r.stagnant).toBe(false);
  });

  it("not stagnant under threshold", () => {
    const r = detectStagnation({ daysSinceLastPR: 25, trainedRecently: true });
    expect(r.stagnant).toBe(false);
  });

  it("stagnant at and beyond threshold with low severity", () => {
    expect(
      detectStagnation({ daysSinceLastPR: 30, trainedRecently: true }).stagnant,
    ).toBe(true);
    expect(
      detectStagnation({ daysSinceLastPR: 35, trainedRecently: true }).severity,
    ).toBe("low");
  });

  it("severity escalates: 60d med, 90d high", () => {
    expect(
      detectStagnation({ daysSinceLastPR: 60, trainedRecently: true }).severity,
    ).toBe("med");
    expect(
      detectStagnation({ daysSinceLastPR: 95, trainedRecently: true }).severity,
    ).toBe("high");
  });

  it("custom threshold respected", () => {
    expect(
      detectStagnation({
        daysSinceLastPR: 15,
        trainedRecently: true,
        thresholdDays: 14,
      }).stagnant,
    ).toBe(true);
  });
});

describe("detectDecline", () => {
  it("not declining when stable", () => {
    const r = detectDecline({
      currentAttendanceRate: 0.7,
      previousAttendanceRate: 0.72,
    });
    expect(r.declining).toBe(false);
  });

  it("not declining when improving", () => {
    const r = detectDecline({
      currentAttendanceRate: 0.8,
      previousAttendanceRate: 0.5,
    });
    expect(r.declining).toBe(false);
    expect(r.deltaPct).toBeGreaterThan(0);
  });

  it("declining when drop >= threshold (default 0.2)", () => {
    const r = detectDecline({
      currentAttendanceRate: 0.4,
      previousAttendanceRate: 0.65,
    });
    expect(r.declining).toBe(true);
    expect(r.deltaPct).toBeLessThan(0);
  });

  it("severity escalates with magnitude", () => {
    expect(
      detectDecline({
        currentAttendanceRate: 0.5,
        previousAttendanceRate: 0.75,
      }).severity,
    ).toBe("low");
    expect(
      detectDecline({
        currentAttendanceRate: 0.4,
        previousAttendanceRate: 0.75,
      }).severity,
    ).toBe("med");
    expect(
      detectDecline({ currentAttendanceRate: 0.2, previousAttendanceRate: 0.8 })
        .severity,
    ).toBe("high");
  });
});

describe("rankImprovers", () => {
  it("returns empty for empty input", () => {
    expect(rankImprovers([], 5)).toEqual([]);
  });

  it("filters out non-positive deltas", () => {
    const out = rankImprovers(
      [
        { athleteId: "a1", name: "A", recentDeltaPct: -2 },
        { athleteId: "a2", name: "B", recentDeltaPct: 0 },
        { athleteId: "a3", name: "C", recentDeltaPct: 5 },
      ],
      5,
    );
    expect(out).toHaveLength(1);
    expect(out[0].athleteId).toBe("a3");
  });

  it("sorts descending by delta and respects topN", () => {
    const out = rankImprovers(
      [
        { athleteId: "a", name: "A", recentDeltaPct: 3 },
        { athleteId: "b", name: "B", recentDeltaPct: 12 },
        { athleteId: "c", name: "C", recentDeltaPct: 7 },
        { athleteId: "d", name: "D", recentDeltaPct: 1 },
      ],
      2,
    );
    expect(out.map((o) => o.athleteId)).toEqual(["b", "c"]);
  });

  it("ties keep stable order from input among equal deltas", () => {
    const out = rankImprovers(
      [
        { athleteId: "a", name: "A", recentDeltaPct: 5 },
        { athleteId: "b", name: "B", recentDeltaPct: 5 },
      ],
      5,
    );
    expect(out).toHaveLength(2);
  });
});
