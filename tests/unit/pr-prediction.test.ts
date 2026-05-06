import { describe, expect, it } from "vitest";
import {
  predictNextPR,
  buildPRNarrativePrompt,
  __test,
  type PRDataPoint,
} from "@/lib/ai/pr-prediction";

function pt(daysAgo: number, value: number): PRDataPoint {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { achievedAt: d, value };
}

describe("predictNextPR", () => {
  it("returns insufficient when no data", () => {
    const r = predictNextPR([], "Snatch");
    expect(r.status).toBe("insufficient");
    expect(r.confidence).toBe(0);
  });

  it("returns insufficient with fewer than 3 points", () => {
    const r = predictNextPR([pt(40, 70), pt(20, 75)], "Snatch");
    expect(r.status).toBe("insufficient");
    expect(r.currentBest).toBe(75);
  });

  it("predicts improvement when trend is clearly positive", () => {
    const data = [pt(60, 70), pt(40, 75), pt(20, 80), pt(5, 82)];
    const r = predictNextPR(data, "Snatch", 6);
    expect(r.status).toBe("improving");
    expect(r.predictedKg).toBeGreaterThan(82);
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  it("returns plateau when slope is flat", () => {
    const data = [pt(60, 80), pt(40, 80), pt(20, 80), pt(5, 80)];
    const r = predictNextPR(data, "Deadlift");
    expect(r.status).toBe("plateau");
    expect(r.predictedKg).toBe(80);
  });

  it("returns declining when trend is negative", () => {
    const data = [pt(60, 90), pt(40, 87), pt(20, 84), pt(5, 81)];
    const r = predictNextPR(data, "Clean");
    expect(r.status).toBe("declining");
    expect(r.confidence).toBe(0);
    expect(r.predictedKg).toBe(r.currentBest);
  });

  it("never returns predicted below current best for improving", () => {
    const data = [pt(30, 80), pt(20, 82), pt(10, 81), pt(5, 83)];
    const r = predictNextPR(data, "Push Press", 6);
    if (r.status === "improving") {
      expect(r.predictedKg).toBeGreaterThanOrEqual(r.currentBest);
    }
  });

  it("rounds predicted and confidence to reasonable precision", () => {
    const data = [pt(60, 70), pt(40, 75), pt(20, 80), pt(5, 82)];
    const r = predictNextPR(data, "Snatch");
    expect(Number.isFinite(r.predictedKg)).toBe(true);
    const decimals = (r.predictedKg.toString().split(".")[1] ?? "").length;
    expect(decimals).toBeLessThanOrEqual(1);
    expect(r.confidence).toBeGreaterThanOrEqual(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
  });

  it("fallback narrative is non-empty for any status", () => {
    const cases = [
      [],
      [pt(20, 75)],
      [pt(60, 70), pt(40, 75), pt(20, 80)],
      [pt(60, 80), pt(40, 80), pt(20, 80)],
      [pt(60, 90), pt(40, 87), pt(20, 84)],
    ];
    for (const data of cases) {
      const r = predictNextPR(data, "Movement");
      expect(r.fallbackNarrative.length).toBeGreaterThan(8);
    }
  });
});

describe("linearRegression", () => {
  it("matches y = 2x with no error", () => {
    const xs = [0, 1, 2, 3];
    const ys = [0, 2, 4, 6];
    const { slope, intercept, r2 } = __test.linearRegression(xs, ys);
    expect(slope).toBeCloseTo(2);
    expect(intercept).toBeCloseTo(0);
    expect(r2).toBeCloseTo(1);
  });

  it("returns slope 0 and r2 0 for identical xs (avoid divide by zero)", () => {
    const xs = [3, 3, 3];
    const ys = [10, 20, 30];
    const result = __test.linearRegression(xs, ys);
    expect(result.slope).toBe(0);
    expect(result.r2).toBe(0);
  });
});

describe("buildPRNarrativePrompt", () => {
  it("includes athlete name, movement, and predicted value", () => {
    const data = [pt(60, 70), pt(40, 75), pt(20, 80), pt(5, 82)];
    const pred = predictNextPR(data, "Snatch");
    const prompt = buildPRNarrativePrompt("Snatch", pred, "Sam");
    expect(prompt).toContain("Sam");
    expect(prompt).toContain("Snatch");
    expect(prompt).toContain(pred.predictedKg.toString());
  });
});
