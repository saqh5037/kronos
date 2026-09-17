import { describe, it, expect } from "vitest";
import {
  CHART_COLORS,
  CHART_PALETTE,
  intensity,
  intensityOpacity,
} from "@/components/charts/tokens";
import { computeYDomain, niceDomain } from "@/components/charts/domain";

describe("categorical palette stays monochrome lime", () => {
  it("never ships the warning token as a decorative series colour", () => {
    expect(CHART_PALETTE).not.toContain("#FFB020");
    expect(CHART_PALETTE).not.toContain(CHART_COLORS.warning);
  });

  it("never ships the danger token as a decorative series colour", () => {
    expect(CHART_PALETTE).not.toContain(CHART_COLORS.negative);
  });

  it("separates categories by opacity, not by hue", () => {
    const hues = new Set(
      CHART_PALETTE.map((c) =>
        c
          .replace(/rgba?\(|\)|\s/g, "")
          .split(",")
          .slice(0, 3)
          .join(","),
      ),
    );
    expect(hues.size).toBe(1);
  });

  it("keeps warning and danger available for real semantics", () => {
    expect(CHART_COLORS.warning).toBe("#FFB020");
    expect(CHART_COLORS.negative).toBe("#FF5A5A");
  });
});

describe("intensity(t) — lime at variable opacity", () => {
  it("is fully opaque lime at the top of the scale", () => {
    expect(intensity(1)).toBe("rgba(200, 255, 45, 1)");
  });

  it("is faint but visible at the bottom of the scale", () => {
    expect(intensityOpacity(0)).toBeCloseTo(0.18, 5);
  });

  it("rises monotonically", () => {
    const steps = [0, 0.25, 0.5, 0.75, 1].map((t) => intensityOpacity(t));
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]).toBeGreaterThan(steps[i - 1]);
    }
  });

  it("clamps out-of-range input instead of producing invalid alpha", () => {
    expect(intensityOpacity(-3)).toBe(intensityOpacity(0));
    expect(intensityOpacity(9)).toBe(intensityOpacity(1));
    expect(intensityOpacity(Number.NaN)).toBe(intensityOpacity(0));
  });

  it("always returns lime, never another hue", () => {
    for (const t of [0, 0.3, 0.7, 1]) {
      expect(intensity(t).startsWith("rgba(200, 255, 45,")).toBe(true);
    }
  });

  it("accepts a custom floor so a chart can go fully transparent", () => {
    expect(intensityOpacity(0, 0)).toBe(0);
  });
});

describe("computeYDomain — counts and money floor at zero", () => {
  it("floors a positive count series at 0 instead of truncating the axis", () => {
    // The audit's "Crecimiento" chart: a 40→52 axis exaggerated the growth.
    expect(computeYDomain([40, 44, 48, 52]).min).toBe(0);
  });

  it("leaves head room above the maximum", () => {
    const d = computeYDomain([40, 44, 48, 52]);
    expect(d.max).toBeGreaterThanOrEqual(52);
  });

  it("floors a money series at 0", () => {
    expect(computeYDomain([138750, 214000]).min).toBe(0);
  });

  it("keeps a zero-only series renderable", () => {
    const d = computeYDomain([0, 0, 0]);
    expect(d.min).toBe(0);
    expect(d.max).toBeGreaterThan(0);
  });

  it("returns a safe domain for an empty series", () => {
    expect(computeYDomain([])).toEqual({ min: 0, max: 1 });
  });

  it("ignores NaN and Infinity", () => {
    expect(computeYDomain([Number.NaN, 10, Number.POSITIVE_INFINITY]).min).toBe(
      0,
    );
  });

  it("does not floor a series that has real negatives", () => {
    expect(computeYDomain([-5, 10]).min).toBeLessThan(0);
  });

  it("allows opting out for a series that does not live near zero", () => {
    const d = computeYDomain([78.2, 79.1, 80.4], { zeroFloor: false });
    expect(d.min).toBeGreaterThan(0);
  });

  it("always produces min < max", () => {
    for (const series of [[5], [0], [-1], [1e6], [3, 3, 3]]) {
      const d = computeYDomain(series);
      expect(d.max).toBeGreaterThan(d.min);
    }
  });
});

describe("niceDomain", () => {
  it("rounds outwards to human step boundaries", () => {
    const d = niceDomain(37, 53, 5);
    expect(d.min).toBeLessThanOrEqual(37);
    expect(d.max).toBeGreaterThanOrEqual(53);
    expect(d.step).toBeGreaterThan(0);
  });

  it("survives a flat range", () => {
    expect(niceDomain(7, 7, 5)).toEqual({ min: 7, max: 8, step: 1 });
  });
});
