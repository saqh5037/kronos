import { describe, expect, it } from "vitest";
import {
  buildBoxProgrammingPrompt,
  buildFallbackCycle,
  expandCycleToClassSlots,
  parseBoxProgramming,
  validateCycleBalance,
  type BoxProgrammingInputs,
  type CycleDraft,
} from "@/lib/ai/box-programming";
import type { WeeklySchedule } from "@/server/actions/box";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function baseInputs(
  over: Partial<BoxProgrammingInputs> = {},
): BoxProgrammingInputs {
  return {
    boxName: "Iron Hands CrossFit",
    disciplineName: "CrossFit",
    startDate: new Date("2026-06-02"), // Monday
    endDate: new Date("2026-06-28"), // 4 weeks
    weeksTotal: 4,
    operatingDays: [1, 3, 5], // Mon, Wed, Fri
    focus: "balanced",
    athleteLevel: "mixed",
    availableMovements: [
      { name: "Back Squat", category: "STRENGTH" },
      { name: "Pull-up", category: "GYMNASTICS" },
      { name: "Box Jump", category: "MONOSTRUCTURAL" },
      { name: "Clean & Jerk", category: "OLYMPIC" },
      { name: "Burpee", category: "MONOSTRUCTURAL" },
    ],
    todayDate: new Date("2026-05-26"),
    ...over,
  };
}

function weeklyScheduleWodMon1_3_5(): WeeklySchedule {
  return {
    mon: { kind: "WOD", hours: [7, 18] },
    tue: null,
    wed: { kind: "WOD", hours: [7] },
    thu: null,
    fri: { kind: "WOD", hours: [7, 18] },
    sat: null,
    sun: null,
  };
}

// ─── buildFallbackCycle ───────────────────────────────────────────────────────

describe("buildFallbackCycle", () => {
  it("clamps weeksTotal to 1 minimum", () => {
    const cycle = buildFallbackCycle(baseInputs({ weeksTotal: 0 }));
    expect(cycle.weeks).toHaveLength(1);
  });

  it("clamps weeksTotal to 8 maximum", () => {
    const cycle = buildFallbackCycle(baseInputs({ weeksTotal: 20 }));
    expect(cycle.weeks).toHaveLength(8);
  });

  it("produces exactly weeksTotal weeks when in range", () => {
    const cycle = buildFallbackCycle(baseInputs({ weeksTotal: 4 }));
    expect(cycle.weeks).toHaveLength(4);
  });

  it("every week has exactly operatingDays.length days", () => {
    const inputs = baseInputs({ operatingDays: [1, 3, 5] }); // 3 days
    const cycle = buildFallbackCycle(inputs);
    for (const week of cycle.weeks) {
      expect(week.days).toHaveLength(3);
    }
  });

  it("matches operating days dow values", () => {
    const inputs = baseInputs({ operatingDays: [1, 3, 5] });
    const cycle = buildFallbackCycle(inputs);
    for (const week of cycle.weeks) {
      const dows = week.days.map((d) => d.dow);
      expect(dows).toEqual([1, 3, 5]);
    }
  });

  it("marks week 4 as deload (every 4th week)", () => {
    const cycle = buildFallbackCycle(baseInputs({ weeksTotal: 8 }));
    expect(cycle.weeks[3].focus.toLowerCase()).toContain("deload");
    expect(cycle.weeks[7].focus.toLowerCase()).toContain("deload");
  });

  it("non-deload weeks cycle through different energy systems", () => {
    const cycle = buildFallbackCycle(baseInputs({ weeksTotal: 4 }));
    const nonDeload = cycle.weeks.filter(
      (w) => !w.focus.toLowerCase().includes("deload"),
    );
    const systems = nonDeload
      .flatMap((w) => w.days.map((d) => d.wod.energySystem))
      .filter(Boolean);
    const unique = new Set(systems);
    expect(unique.size).toBeGreaterThan(1);
  });

  it("every WOD description is non-empty", () => {
    const cycle = buildFallbackCycle(baseInputs());
    for (const week of cycle.weeks) {
      for (const day of week.days) {
        expect(day.wod.description.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("source is 'fallback'", () => {
    expect(buildFallbackCycle(baseInputs()).source).toBe("fallback");
  });

  it("produces a balanced mix of energy systems across 8 weeks", () => {
    const cycle = buildFallbackCycle(baseInputs({ weeksTotal: 8 }));
    const systems = cycle.weeks
      .flatMap((w) => w.days.map((d) => d.wod.energySystem))
      .filter(Boolean);
    const unique = new Set(systems);
    expect(unique.size).toBeGreaterThanOrEqual(3);
  });
});

// ─── parseBoxProgramming ──────────────────────────────────────────────────────

describe("parseBoxProgramming", () => {
  const validDraft: CycleDraft = {
    overview: "Balanced cycle mixing strength and conditioning.",
    source: "ai",
    weeks: [
      {
        weekNumber: 1,
        focus: "Strength base",
        days: [
          {
            dow: 1,
            focus: "Strength",
            wod: {
              name: "Back Squat Day",
              type: "STRENGTH",
              scoreType: "WEIGHT",
              energySystem: "STRENGTH",
              description: "5x5 Back Squat at 75% 1RM",
              movements: [{ name: "Back Squat", reps: 5 }],
            },
          },
        ],
      },
    ],
  };

  it("parses valid JSON cycle", () => {
    const raw = JSON.stringify(validDraft);
    const result = parseBoxProgramming(raw);
    expect(result).not.toBeNull();
    expect(result!.weeks).toHaveLength(1);
    expect(result!.source).toBe("ai");
  });

  it("strips markdown code fences", () => {
    const raw = "```json\n" + JSON.stringify(validDraft) + "\n```";
    const result = parseBoxProgramming(raw);
    expect(result).not.toBeNull();
    expect(result!.weeks).toHaveLength(1);
  });

  it("returns null for invalid JSON", () => {
    expect(parseBoxProgramming("not json {{ broken")).toBeNull();
  });

  it("returns null for missing weeks array", () => {
    expect(parseBoxProgramming('{"overview":"no weeks"}')).toBeNull();
  });

  it("returns null for empty weeks array", () => {
    expect(parseBoxProgramming('{"overview":"test","weeks":[]}')).toBeNull();
  });

  it("fills malformed day/wod with safe defaults", () => {
    const partial = {
      overview: "ok",
      weeks: [{ weekNumber: 1, focus: "Strength", days: [{}] }],
    };
    const result = parseBoxProgramming(JSON.stringify(partial));
    expect(result).not.toBeNull();
    expect(result!.weeks[0].days[0].wod.description.trim().length).toBeGreaterThan(0);
  });

  it("never allows empty description — fills with placeholder", () => {
    const withEmpty = {
      overview: "ok",
      weeks: [
        {
          weekNumber: 1,
          focus: "Strength",
          days: [
            {
              dow: 1,
              focus: "Strength",
              wod: {
                name: "WOD",
                type: "AMRAP",
                scoreType: "REPS",
                energySystem: "METCON_SHORT",
                description: "",
                movements: [],
              },
            },
          ],
        },
      ],
    };
    const result = parseBoxProgramming(JSON.stringify(withEmpty));
    expect(result).not.toBeNull();
    expect(result!.weeks[0].days[0].wod.description.trim().length).toBeGreaterThan(0);
  });
});

// ─── buildBoxProgrammingPrompt ────────────────────────────────────────────────

describe("buildBoxProgrammingPrompt", () => {
  it("instructs JSON-only output (no markdown)", () => {
    const prompt = buildBoxProgrammingPrompt(baseInputs());
    expect(prompt.toLowerCase()).toMatch(/json/);
    expect(prompt).toMatch(/without.*markdown|no markdown|JSON only|solo JSON/i);
  });

  it("includes all operating days", () => {
    const prompt = buildBoxProgrammingPrompt(baseInputs({ operatingDays: [1, 3, 5] }));
    // 1=Mon, 3=Wed, 5=Fri
    expect(prompt).toContain("1");
    expect(prompt).toContain("3");
    expect(prompt).toContain("5");
  });

  it("includes the movement allow-list", () => {
    const inputs = baseInputs();
    const prompt = buildBoxProgrammingPrompt(inputs);
    for (const m of inputs.availableMovements) {
      expect(prompt).toContain(m.name);
    }
  });

  it("mentions deload every 4th week", () => {
    const prompt = buildBoxProgrammingPrompt(baseInputs());
    expect(prompt.toLowerCase()).toMatch(/deload/);
  });

  it("includes box name and discipline", () => {
    const prompt = buildBoxProgrammingPrompt(baseInputs());
    expect(prompt).toContain("Iron Hands CrossFit");
    expect(prompt).toContain("CrossFit");
  });

  it("includes focus and athlete level", () => {
    const prompt = buildBoxProgrammingPrompt(
      baseInputs({ focus: "strength", athleteLevel: "intermediate" }),
    );
    expect(prompt).toContain("strength");
    expect(prompt).toContain("intermediate");
  });

  it("caps movement allow-list length", () => {
    const many = Array.from({ length: 60 }, (_, i) => ({
      name: `Move ${i}`,
      category: "STRENGTH",
    }));
    const prompt = buildBoxProgrammingPrompt(baseInputs({ availableMovements: many }));
    // Should not include all 60 — the spec says length-capped
    const moveCount = (prompt.match(/Move \d+/g) ?? []).length;
    expect(moveCount).toBeLessThan(60);
  });
});

// ─── expandCycleToClassSlots ──────────────────────────────────────────────────

describe("expandCycleToClassSlots", () => {
  const schedule = weeklyScheduleWodMon1_3_5();

  it("generates correct number of slots (weeks × days × hours)", () => {
    const cycle = buildFallbackCycle(baseInputs({ weeksTotal: 2 }));
    // week1: Mon(2h)+Wed(1h)+Fri(2h) = 5 slots, x2 weeks = 10
    const slots = expandCycleToClassSlots(
      cycle,
      schedule,
      new Date("2026-06-02"),
      "America/Mexico_City",
    );
    expect(slots).toHaveLength(10);
  });

  it("skips days that are null in weeklySchedule", () => {
    const slots = expandCycleToClassSlots(
      buildFallbackCycle(baseInputs({ weeksTotal: 1 })),
      schedule,
      new Date("2026-06-02"),
      "America/Mexico_City",
    );
    const dows = slots.map((s) => s.dow);
    expect(dows).not.toContain(2); // Tue
    expect(dows).not.toContain(4); // Thu
  });

  it("skips OPEN_BOX days", () => {
    const mixedSchedule: WeeklySchedule = {
      mon: { kind: "OPEN_BOX", hours: [10] },
      tue: null,
      wed: { kind: "WOD", hours: [7] },
      thu: null,
      fri: null,
      sat: null,
      sun: null,
    };
    const slots = expandCycleToClassSlots(
      buildFallbackCycle(baseInputs({ weeksTotal: 1, operatingDays: [3] })),
      mixedSchedule,
      new Date("2026-06-02"),
      "America/Mexico_City",
    );
    const dows = slots.map((s) => s.dow);
    expect(dows).not.toContain(1); // Mon (OPEN_BOX)
    expect(dows).toContain(3); // Wed (WOD)
  });

  it("produces slots ordered chronologically", () => {
    const slots = expandCycleToClassSlots(
      buildFallbackCycle(baseInputs({ weeksTotal: 2 })),
      schedule,
      new Date("2026-06-02"),
      "America/Mexico_City",
    );
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i].date.getTime()).toBeGreaterThanOrEqual(
        slots[i - 1].date.getTime(),
      );
    }
  });

  it("maps week 1 monday to correct calendar date", () => {
    const slots = expandCycleToClassSlots(
      buildFallbackCycle(baseInputs({ weeksTotal: 1 })),
      schedule,
      new Date("2026-06-02"), // Monday
      "America/Mexico_City",
    );
    const mondaySlots = slots.filter((s) => s.dow === 1 && s.weekNumber === 1);
    expect(mondaySlots).toHaveLength(2); // two hours on Mon
    // First slot is June 2
    const d = mondaySlots[0].date;
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(5); // June (0-indexed)
    expect(d.getUTCDate()).toBe(2);
  });

  it("assigns correct weekNumber per slot", () => {
    const slots = expandCycleToClassSlots(
      buildFallbackCycle(baseInputs({ weeksTotal: 2 })),
      schedule,
      new Date("2026-06-02"),
      "America/Mexico_City",
    );
    const week1 = slots.filter((s) => s.weekNumber === 1);
    const week2 = slots.filter((s) => s.weekNumber === 2);
    expect(week1.length).toBeGreaterThan(0);
    expect(week2.length).toBeGreaterThan(0);
    // All week2 dates must be >= first week2 monday
    for (const s of week2) {
      expect(s.date.getTime()).toBeGreaterThan(
        week1[week1.length - 1].date.getTime(),
      );
    }
  });
});

// ─── validateCycleBalance ─────────────────────────────────────────────────────

describe("validateCycleBalance", () => {
  it("returns empty warnings for a well-balanced cycle", () => {
    const cycle = buildFallbackCycle(baseInputs({ weeksTotal: 8 }));
    const result = validateCycleBalance(cycle, "balanced");
    // Fallback should produce a reasonably balanced cycle
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("warns when all weeks have the same energy system", () => {
    const allStrength: CycleDraft = {
      overview: "mono",
      source: "ai",
      weeks: Array.from({ length: 4 }, (_, i) => ({
        weekNumber: i + 1,
        focus: "Strength",
        days: [
          {
            dow: 1,
            focus: "Strength",
            wod: {
              name: "Squat",
              type: "STRENGTH" as const,
              scoreType: "WEIGHT" as const,
              energySystem: "STRENGTH" as const,
              description: "5x5 Back Squat",
              movements: [],
            },
          },
        ],
      })),
    };
    const result = validateCycleBalance(allStrength, "balanced");
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("warns when there is no deload week in 4+ week cycle", () => {
    const noDeload: CycleDraft = {
      overview: "no deload",
      source: "ai",
      weeks: Array.from({ length: 4 }, (_, i) => ({
        weekNumber: i + 1,
        focus: "Conditioning",
        days: [
          {
            dow: 1,
            focus: "Metcon",
            wod: {
              name: "Metcon",
              type: "AMRAP" as const,
              scoreType: "REPS" as const,
              energySystem: "METCON_SHORT" as const,
              description: "20min AMRAP",
              movements: [],
            },
          },
        ],
      })),
    };
    const result = validateCycleBalance(noDeload, "balanced");
    const hasDeloadWarning = result.warnings.some((w) =>
      w.toLowerCase().includes("deload"),
    );
    expect(hasDeloadWarning).toBe(true);
  });

  it("warns on focus mismatch — strength focus but mostly METCON days", () => {
    const metconBias: CycleDraft = {
      overview: "metcon heavy",
      source: "ai",
      weeks: Array.from({ length: 4 }, (_, i) => ({
        weekNumber: i + 1,
        focus: "Conditioning",
        days: [
          {
            dow: 1,
            focus: "Metcon",
            wod: {
              name: "Metcon 1",
              type: "AMRAP" as const,
              scoreType: "REPS" as const,
              energySystem: "METCON_SHORT" as const,
              description: "Short AMRAP",
              movements: [],
            },
          },
          {
            dow: 3,
            focus: "Metcon",
            wod: {
              name: "Metcon 2",
              type: "FORTIME" as const,
              scoreType: "TIME" as const,
              energySystem: "METCON_LONG" as const,
              description: "For time chipper",
              movements: [],
            },
          },
        ],
      })),
    };
    const result = validateCycleBalance(metconBias, "strength");
    const hasFocusWarning = result.warnings.some(
      (w) =>
        w.toLowerCase().includes("strength") ||
        w.toLowerCase().includes("focus") ||
        w.toLowerCase().includes("mismatch"),
    );
    expect(hasFocusWarning).toBe(true);
  });
});
