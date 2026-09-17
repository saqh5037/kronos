import { describe, it, expect } from "vitest";
import {
  scoreDirection,
  unitDirection,
  compareByMetric,
  isBetterByDirection,
  sortByMetric,
} from "@/lib/scores/direction";
import {
  parseTimeToSeconds,
  formatSecondsAsTime,
  maskTimeInput,
  parseRoundsReps,
  unpackRoundsReps,
  formatRoundsReps,
  clampWeight,
  stepWeight,
  stepReps,
  WEIGHT_STEP_KG,
} from "@/lib/scores/input";

describe("metric direction", () => {
  it("ranks TIME ascending and everything else descending", () => {
    expect(scoreDirection("TIME")).toBe("asc");
    expect(scoreDirection("REPS")).toBe("desc");
    expect(scoreDirection("WEIGHT")).toBe("desc");
    expect(scoreDirection("ROUNDS_REPS")).toBe("desc");
  });

  it("infers direction from a PR unit when there is no scoreType", () => {
    expect(unitDirection("s")).toBe("asc");
    expect(unitDirection("MIN")).toBe("asc");
    expect(unitDirection(" mm:ss ")).toBe("asc");
    expect(unitDirection("kg")).toBe("desc");
    expect(unitDirection("reps")).toBe("desc");
    expect(unitDirection(null)).toBe("desc");
  });

  it("sorts a TIME board fastest-first (the MURPH HOY regression)", () => {
    // Exactly the values the audit captured on the home board, in the order the
    // old `createdAt desc` query returned them.
    const board = [
      { name: "a", seconds: 11 * 60 + 48 },
      { name: "b", seconds: 9 * 60 + 4 },
      { name: "c", seconds: 4 * 60 + 4 },
      { name: "d", seconds: 9 * 60 },
    ];
    expect(sortByMetric(board, (r) => r.seconds, "TIME").map((r) => r.name)).toEqual(
      ["c", "d", "b", "a"],
    );
  });

  it("sorts REPS / WEIGHT / ROUNDS_REPS boards highest-first", () => {
    const rows = [{ v: 90 }, { v: 120 }, { v: 111 }];
    expect(sortByMetric(rows, (r) => r.v, "WEIGHT").map((r) => r.v)).toEqual([
      120, 111, 90,
    ]);
    expect(sortByMetric(rows, (r) => r.v, "REPS").map((r) => r.v)).toEqual([
      120, 111, 90,
    ]);
    expect(
      sortByMetric([{ v: 5.12 }, { v: 6.0 }, { v: 5.9 }], (r) => r.v, "ROUNDS_REPS").map(
        (r) => r.v,
      ),
    ).toEqual([6.0, 5.9, 5.12]);
  });

  it("does not mutate the input array", () => {
    const rows = [{ v: 1 }, { v: 9 }];
    sortByMetric(rows, (r) => r.v, "WEIGHT");
    expect(rows.map((r) => r.v)).toEqual([1, 9]);
  });

  it("compares and improves consistently with the direction", () => {
    expect(compareByMetric(100, 200, "TIME")).toBeLessThan(0);
    expect(compareByMetric(100, 200, "WEIGHT")).toBeGreaterThan(0);
    expect(isBetterByDirection(300, 280, "asc")).toBe(true);
    expect(isBetterByDirection(300, 320, "asc")).toBe(false);
    expect(isBetterByDirection(100, 120, "desc")).toBe(true);
  });
});

describe("mm:ss parsing", () => {
  it("round-trips mm:ss", () => {
    expect(parseTimeToSeconds("41:20")).toBe(2480);
    expect(formatSecondsAsTime(2480)).toBe("41:20");
    expect(parseTimeToSeconds("0:59")).toBe(59);
    expect(formatSecondsAsTime(59)).toBe("0:59");
  });

  it("accepts h:mm:ss and formats past the hour", () => {
    expect(parseTimeToSeconds("1:02:03")).toBe(3723);
    expect(formatSecondsAsTime(3723)).toBe("1:02:03");
  });

  it("reads a bare number as seconds", () => {
    expect(parseTimeToSeconds("620")).toBe(620);
  });

  it("returns null instead of NaN for malformed input", () => {
    for (const bad of ["", "   ", "abc", "5:75", "1:99:00", "1:2:3:4", "5:3o"]) {
      expect(parseTimeToSeconds(bad)).toBeNull();
    }
  });

  it("masks typed digits into mm:ss progressively", () => {
    expect(maskTimeInput("4")).toBe("4");
    expect(maskTimeInput("41")).toBe("41");
    expect(maskTimeInput("412")).toBe("4:12");
    expect(maskTimeInput("4120")).toBe("41:20");
    expect(maskTimeInput("41m20s")).toBe("41:20");
    expect(maskTimeInput("10203")).toBe("1:02:03");
  });
});

describe("rounds + reps", () => {
  it("packs and unpacks the rounds.reps decimal", () => {
    expect(parseRoundsReps(5, 12)).toBeCloseTo(5.12, 5);
    expect(unpackRoundsReps(5.12)).toEqual({ rounds: 5, reps: 12 });
    expect(formatRoundsReps(5.12)).toBe("5+12");
    expect(parseRoundsReps("7", "0")).toBe(7);
    expect(formatRoundsReps(7)).toBe("7+0");
  });

  it("treats blank fields as zero and rejects impossible pairs", () => {
    expect(parseRoundsReps("", "")).toBe(0);
    expect(parseRoundsReps(5, 100)).toBeNull();
    expect(parseRoundsReps(-1, 3)).toBeNull();
    expect(parseRoundsReps(5.5, 3)).toBeNull();
    expect(parseRoundsReps("x", "3")).toBeNull();
  });

  it("carries a rounding artefact into the next round", () => {
    expect(unpackRoundsReps(5.999)).toEqual({ rounds: 6, reps: 0 });
  });
});

describe("weight and reps steppers", () => {
  it("steps weight by plate increments and never below zero", () => {
    expect(stepWeight(100, 1)).toBe(100 + WEIGHT_STEP_KG);
    expect(stepWeight(100, -1)).toBe(100 - WEIGHT_STEP_KG);
    expect(stepWeight(1, -1)).toBe(0);
  });

  it("clamps weight to half-kilo precision and a sane maximum", () => {
    expect(clampWeight(102.26)).toBe(102.5);
    expect(clampWeight(-5)).toBe(0);
    expect(clampWeight(10_000)).toBe(500);
    expect(clampWeight(Number.NaN)).toBe(0);
  });

  it("steps reps as integers", () => {
    expect(stepReps(12, 1)).toBe(13);
    expect(stepReps(0, -1)).toBe(0);
    expect(stepReps(12.4, 1)).toBe(13);
  });
});
