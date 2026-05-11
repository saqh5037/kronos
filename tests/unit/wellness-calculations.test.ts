import { describe, it, expect } from "vitest";
import {
  calcBMI,
  detectTrend,
  formatMeasurement,
  defaultUnitFor,
  calcWellnessProgress,
} from "../../src/lib/wellness/calculations";

describe("calcBMI", () => {
  it("computes a standard BMI", () => {
    expect(calcBMI(70, 175)).toBeCloseTo(22.9, 1);
  });

  it("rounds to one decimal", () => {
    expect(calcBMI(80, 180)).toBe(24.7);
  });

  it("returns null on invalid weight", () => {
    expect(calcBMI(0, 170)).toBeNull();
    expect(calcBMI(-1, 170)).toBeNull();
  });

  it("returns null on invalid height", () => {
    expect(calcBMI(70, 0)).toBeNull();
    expect(calcBMI(70, -1)).toBeNull();
  });
});

describe("detectTrend", () => {
  it("flat when zero or one value", () => {
    expect(detectTrend([])).toBe("flat");
    expect(detectTrend([75])).toBe("flat");
  });

  it("up when last > prev clearly", () => {
    expect(detectTrend([74, 75, 77])).toBe("up");
  });

  it("down when last < prev clearly", () => {
    expect(detectTrend([77, 75, 74])).toBe("down");
  });

  it("flat when delta is within 1%", () => {
    expect(detectTrend([75.0, 75.2])).toBe("flat");
  });
});

describe("formatMeasurement", () => {
  it("rounds and appends unit", () => {
    expect(formatMeasurement(75.45, "kg")).toBe("75.5 kg");
  });

  it("integer drops decimals", () => {
    expect(formatMeasurement(80, "cm")).toBe("80 cm");
  });

  it("no unit returns just the number", () => {
    expect(formatMeasurement(22.9, "")).toBe("22.9");
  });
});

describe("defaultUnitFor", () => {
  it("returns kg for WEIGHT", () => {
    expect(defaultUnitFor("WEIGHT")).toBe("kg");
  });

  it("returns % for BODY_FAT and MUSCLE_MASS", () => {
    expect(defaultUnitFor("BODY_FAT")).toBe("%");
    expect(defaultUnitFor("MUSCLE_MASS")).toBe("%");
  });

  it("returns cm for perimeters and HEIGHT", () => {
    expect(defaultUnitFor("WAIST")).toBe("cm");
    expect(defaultUnitFor("HIP")).toBe("cm");
    expect(defaultUnitFor("ARM")).toBe("cm");
    expect(defaultUnitFor("THIGH")).toBe("cm");
    expect(defaultUnitFor("CHEST")).toBe("cm");
    expect(defaultUnitFor("HEIGHT")).toBe("cm");
  });

  it("returns empty for BMI and CUSTOM", () => {
    expect(defaultUnitFor("BMI")).toBe("");
    expect(defaultUnitFor("CUSTOM")).toBe("");
  });
});

describe("calcWellnessProgress", () => {
  it("descending: starts at 0% when no change", () => {
    const r = calcWellnessProgress({
      startValue: 80,
      currentValue: 80,
      targetValue: 75,
    });
    expect(r.pct).toBe(0);
    expect(r.direction).toBe("descending");
    expect(r.deltaRemaining).toBe(5);
    expect(r.achieved).toBe(false);
  });

  it("descending: 50% halfway through weight loss", () => {
    const r = calcWellnessProgress({
      startValue: 80,
      currentValue: 77.5,
      targetValue: 75,
    });
    expect(r.pct).toBeCloseTo(50, 0);
    expect(r.direction).toBe("descending");
    expect(r.deltaRemaining).toBe(2.5);
    expect(r.achieved).toBe(false);
  });

  it("descending: 100% when current reaches target", () => {
    const r = calcWellnessProgress({
      startValue: 80,
      currentValue: 75,
      targetValue: 75,
    });
    expect(r.pct).toBe(100);
    expect(r.achieved).toBe(true);
    expect(r.deltaRemaining).toBe(0);
  });

  it("descending: 100% when overshooting", () => {
    const r = calcWellnessProgress({
      startValue: 80,
      currentValue: 73,
      targetValue: 75,
    });
    expect(r.pct).toBe(100);
    expect(r.achieved).toBe(true);
  });

  it("ascending: 50% halfway in muscle gain", () => {
    const r = calcWellnessProgress({
      startValue: 30,
      currentValue: 31.5,
      targetValue: 33,
    });
    expect(r.pct).toBeCloseTo(50, 0);
    expect(r.direction).toBe("ascending");
    expect(r.deltaRemaining).toBe(1.5);
    expect(r.achieved).toBe(false);
  });

  it("ascending: 100% when reaching target", () => {
    const r = calcWellnessProgress({
      startValue: 30,
      currentValue: 33,
      targetValue: 33,
    });
    expect(r.pct).toBe(100);
    expect(r.achieved).toBe(true);
  });

  it("equal start and target with mismatched current → 0%", () => {
    const r = calcWellnessProgress({
      startValue: 75,
      currentValue: 74,
      targetValue: 75,
    });
    expect(r.pct).toBe(0);
    expect(r.achieved).toBe(false);
  });

  it("equal start, target and current → 100%", () => {
    const r = calcWellnessProgress({
      startValue: 75,
      currentValue: 75,
      targetValue: 75,
    });
    expect(r.pct).toBe(100);
    expect(r.achieved).toBe(true);
  });
});
