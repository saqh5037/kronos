import { describe, it, expect } from "vitest";
import { detectPR, isBetterScore, formatScore } from "../../src/lib/scores";
import {
  scoreSchema,
  timeStringToSeconds,
  defaultUnit,
} from "../../src/lib/validations/score";

describe("isBetterScore", () => {
  it("TIME: lower is better", () => {
    expect(isBetterScore(180, 175, "TIME")).toBe(true);
    expect(isBetterScore(180, 185, "TIME")).toBe(false);
    expect(isBetterScore(180, 180, "TIME")).toBe(false);
  });

  it("WEIGHT: higher is better", () => {
    expect(isBetterScore(100, 105, "WEIGHT")).toBe(true);
    expect(isBetterScore(100, 95, "WEIGHT")).toBe(false);
    expect(isBetterScore(100, 100, "WEIGHT")).toBe(false);
  });

  it("REPS: higher is better", () => {
    expect(isBetterScore(20, 25, "REPS")).toBe(true);
    expect(isBetterScore(20, 15, "REPS")).toBe(false);
  });

  it("ROUNDS_REPS: higher packed value is better", () => {
    // 5+12 → 5.12 vs 5+10 → 5.10
    expect(isBetterScore(5.1, 5.12, "ROUNDS_REPS")).toBe(true);
    // 4+50 → 4.50 vs 5+0 → 5.0
    expect(isBetterScore(4.5, 5.0, "ROUNDS_REPS")).toBe(true);
  });
});

describe("detectPR", () => {
  it("returns candidate when no previous PR", () => {
    expect(detectPR(null, 100, "WEIGHT")).toBe(100);
    expect(detectPR(null, 180, "TIME")).toBe(180);
  });

  it("returns candidate when better", () => {
    expect(detectPR(100, 105, "WEIGHT")).toBe(105);
    expect(detectPR(180, 170, "TIME")).toBe(170);
  });

  it("returns null when not better", () => {
    expect(detectPR(100, 95, "WEIGHT")).toBeNull();
    expect(detectPR(180, 200, "TIME")).toBeNull();
  });

  it("ties are NOT new PRs", () => {
    expect(detectPR(100, 100, "WEIGHT")).toBeNull();
    expect(detectPR(180, 180, "TIME")).toBeNull();
  });
});

describe("formatScore", () => {
  it("formats TIME as mm:ss", () => {
    expect(formatScore(180, "TIME")).toBe("3:00");
    expect(formatScore(95, "TIME")).toBe("1:35");
  });

  it("formats REPS with suffix", () => {
    expect(formatScore(120, "REPS")).toBe("120 reps");
  });

  it("formats WEIGHT with kg suffix", () => {
    expect(formatScore(102.5, "WEIGHT")).toBe("102.5 kg");
  });

  it("formats ROUNDS_REPS as rounds+reps", () => {
    expect(formatScore(5.12, "ROUNDS_REPS")).toBe("5+12");
    expect(formatScore(7.0, "ROUNDS_REPS")).toBe("7+0");
  });
});

describe("scoreSchema", () => {
  it("parses minimal score", () => {
    const parsed = scoreSchema.parse({
      wodId: "wod-1",
      value: 180,
      unit: "s",
    });
    expect(parsed.scaling).toBe("RX");
  });

  it("rejects negative value", () => {
    expect(() =>
      scoreSchema.parse({ wodId: "w", value: -5, unit: "s" }),
    ).toThrow();
  });

  it("rejects empty wodId", () => {
    expect(() =>
      scoreSchema.parse({ wodId: "", value: 100, unit: "kg" }),
    ).toThrow();
  });

  it("normalizes empty classId to null", () => {
    const parsed = scoreSchema.parse({
      wodId: "w",
      value: 100,
      unit: "kg",
      classId: "",
    });
    expect(parsed.classId).toBeNull();
  });
});

describe("timeStringToSeconds", () => {
  it("parses mm:ss", () => {
    expect(timeStringToSeconds("3:30")).toBe(210);
    expect(timeStringToSeconds("0:45")).toBe(45);
  });

  it("falls back to plain number when no colon", () => {
    expect(timeStringToSeconds("180")).toBe(180);
  });
});

describe("defaultUnit", () => {
  it("maps each scoreType", () => {
    expect(defaultUnit("TIME")).toBe("s");
    expect(defaultUnit("REPS")).toBe("reps");
    expect(defaultUnit("WEIGHT")).toBe("kg");
    expect(defaultUnit("ROUNDS_REPS")).toBe("rounds");
  });
});
