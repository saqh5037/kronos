import { describe, expect, it } from "vitest";
import {
  buildFallbackPlan,
  buildTrainingPlanPrompt,
  parseGeminiPlan,
  weeksAvailableUntil,
  type TrainingPlanInputs,
} from "@/lib/ai/training-plan";

function inputs(over: Partial<TrainingPlanInputs> = {}): TrainingPlanInputs {
  return {
    athleteFirstName: "Sam",
    goalMetric: "PR",
    goalMovementName: "Snatch",
    goalTargetValue: 90,
    goalStartValue: 75,
    goalUnit: "kg",
    goalDeadline: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000),
    weeksAvailable: 12,
    weeklyTrainingFrequency: 4,
    recentPRs: [],
    todayDate: new Date(),
    ...over,
  };
}

describe("weeksAvailableUntil", () => {
  it("clamps to 12 weeks max", () => {
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    expect(weeksAvailableUntil(future)).toBe(12);
  });

  it("clamps to 1 week min for past deadlines", () => {
    const past = new Date(Date.now() - 1000);
    expect(weeksAvailableUntil(past)).toBe(1);
  });

  it("returns ~6 for 6 weeks ahead", () => {
    const sixWeeks = new Date(Date.now() + 6 * 7 * 24 * 60 * 60 * 1000);
    expect(weeksAvailableUntil(sixWeeks)).toBeGreaterThanOrEqual(5);
    expect(weeksAvailableUntil(sixWeeks)).toBeLessThanOrEqual(7);
  });
});

describe("buildFallbackPlan", () => {
  it("returns the correct number of weeks", () => {
    const plan = buildFallbackPlan(inputs({ weeksAvailable: 8 }));
    expect(plan.weeks).toHaveLength(8);
  });

  it("inserts deload week every 4 weeks", () => {
    const plan = buildFallbackPlan(inputs({ weeksAvailable: 12 }));
    expect(plan.weeks[3].focus).toBe("Descarga");
    expect(plan.weeks[7].focus).toBe("Descarga");
  });

  it("last weeks are peak", () => {
    const plan = buildFallbackPlan(inputs({ weeksAvailable: 12 }));
    expect(plan.weeks[10].focus).toContain("Peak");
    expect(plan.weeks[11].focus).toContain("Peak");
  });

  it("respects training frequency for sessions per week", () => {
    const planLow = buildFallbackPlan(inputs({ weeklyTrainingFrequency: 3 }));
    const planHigh = buildFallbackPlan(inputs({ weeklyTrainingFrequency: 5 }));
    expect(planLow.weeks[0].sessions).toHaveLength(3);
    expect(planHigh.weeks[0].sessions).toHaveLength(5);
  });

  it("clamps weeks to 12 max", () => {
    const plan = buildFallbackPlan(inputs({ weeksAvailable: 50 }));
    expect(plan.weeks).toHaveLength(12);
  });

  it("source is fallback", () => {
    expect(buildFallbackPlan(inputs()).source).toBe("fallback");
  });
});

describe("buildTrainingPlanPrompt", () => {
  it("includes athlete name and target", () => {
    const prompt = buildTrainingPlanPrompt(inputs());
    expect(prompt).toContain("Sam");
    expect(prompt).toContain("90 kg");
    expect(prompt).toContain("Snatch");
  });

  it("instructs JSON only", () => {
    const prompt = buildTrainingPlanPrompt(inputs());
    expect(prompt).toContain("JSON válido");
  });

  it("limits recent PRs to 5", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      movementName: "Snatch",
      value: 70 + i,
      daysAgo: i * 5,
    }));
    const prompt = buildTrainingPlanPrompt(inputs({ recentPRs: many }));
    const matches = prompt.match(/"value":/g);
    expect(matches!.length).toBeLessThanOrEqual(5);
  });
});

describe("parseGeminiPlan", () => {
  it("parses valid JSON with weeks", () => {
    const raw = JSON.stringify({
      overview: "Strategy here",
      weeks: [
        {
          weekNumber: 1,
          focus: "fuerza base",
          sessions: [{ day: "Lun", type: "Fuerza", description: "5x5 squat" }],
          notes: "ojo con la técnica",
        },
      ],
    });
    const result = parseGeminiPlan(raw);
    expect(result).not.toBeNull();
    expect(result!.weeks).toHaveLength(1);
    expect(result!.source).toBe("ai");
    expect(result!.overview).toBe("Strategy here");
  });

  it("strips markdown fences", () => {
    const raw = '```json\n{"weeks":[{"weekNumber":1}]}\n```';
    const result = parseGeminiPlan(raw);
    expect(result).not.toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseGeminiPlan("not json {")).toBeNull();
  });

  it("returns null for missing weeks array", () => {
    expect(parseGeminiPlan('{"overview": "no weeks"}')).toBeNull();
  });

  it("fills in defaults for malformed week entries", () => {
    const raw = JSON.stringify({ weeks: [{}] });
    const result = parseGeminiPlan(raw);
    expect(result).not.toBeNull();
    expect(result!.weeks[0].weekNumber).toBe(1);
    expect(result!.weeks[0].focus).toBeTruthy();
  });
});
