import { describe, it, expect } from "vitest";
import {
  evaluateCriterion,
  isCriterion,
  triggerMatchesType,
  xpForBadgeCode,
  type AthleteState,
  type Criterion,
} from "@/server/achievements/criteria";

const baseState = (over: Partial<AthleteState> = {}): AthleteState => ({
  attendanceCount: 0,
  attendanceStreak: 0,
  prCount: 0,
  rxScoreCount: 0,
  prByMovement: {},
  bodyweightKg: undefined,
  skillLevelsAchieved: new Set<string>(),
  ...over,
});

describe("evaluateCriterion · skill_level_reached", () => {
  it("unlocks cuando el atleta tiene la progression como ACHIEVED", () => {
    const c: Criterion = {
      type: "skill_level_reached",
      movementSlug: "pull-up",
      progressionSlug: "strict-pull-up",
    };
    expect(
      evaluateCriterion(
        c,
        baseState({
          skillLevelsAchieved: new Set(["pull-up:strict-pull-up"]),
        }),
      ),
    ).toBe(true);
  });

  it("no unlocks si la progression no está achieved", () => {
    const c: Criterion = {
      type: "skill_level_reached",
      movementSlug: "pull-up",
      progressionSlug: "strict-pull-up",
    };
    expect(
      evaluateCriterion(
        c,
        baseState({
          skillLevelsAchieved: new Set(["pull-up:ring-rows"]),
        }),
      ),
    ).toBe(false);
    expect(evaluateCriterion(c, baseState())).toBe(false);
  });

  it("isCriterion valida shape", () => {
    expect(
      isCriterion({
        type: "skill_level_reached",
        movementSlug: "pull-up",
        progressionSlug: "strict",
      }),
    ).toBe(true);
    expect(isCriterion({ type: "skill_level_reached" })).toBe(false);
    expect(
      isCriterion({
        type: "skill_level_reached",
        movementSlug: 123,
        progressionSlug: "strict",
      }),
    ).toBe(false);
  });

  it("triggerMatchesType respeta SKILL trigger", () => {
    expect(triggerMatchesType("SKILL", "skill_level_reached")).toBe(true);
    expect(triggerMatchesType("SKILL", "attendance")).toBe(false);
    expect(triggerMatchesType("PR", "skill_level_reached")).toBe(false);
    expect(triggerMatchesType("BULK", "skill_level_reached")).toBe(true);
    expect(triggerMatchesType("BACKFILL", "skill_level_reached")).toBe(true);
  });
});

describe("evaluateCriterion · attendance", () => {
  it("unlocks when count >= threshold", () => {
    const c: Criterion = { type: "attendance", count: 1 };
    expect(evaluateCriterion(c, baseState({ attendanceCount: 1 }))).toBe(true);
    expect(evaluateCriterion(c, baseState({ attendanceCount: 5 }))).toBe(true);
  });
  it("locked when below threshold", () => {
    const c: Criterion = { type: "attendance", count: 5 };
    expect(evaluateCriterion(c, baseState({ attendanceCount: 4 }))).toBe(false);
  });
});

describe("evaluateCriterion · attendance_streak", () => {
  it("unlocks at exact streak", () => {
    const c: Criterion = { type: "attendance_streak", count: 7 };
    expect(evaluateCriterion(c, baseState({ attendanceStreak: 7 }))).toBe(true);
  });
  it("locked when streak < threshold", () => {
    const c: Criterion = { type: "attendance_streak", count: 30 };
    expect(evaluateCriterion(c, baseState({ attendanceStreak: 29 }))).toBe(
      false,
    );
  });
});

describe("evaluateCriterion · pr / rx_count", () => {
  it("pr count unlocks when reached", () => {
    const c: Criterion = { type: "pr", count: 1 };
    expect(evaluateCriterion(c, baseState({ prCount: 1 }))).toBe(true);
  });
  it("rx_count requires RX scores", () => {
    const c: Criterion = { type: "rx_count", count: 5 };
    expect(evaluateCriterion(c, baseState({ rxScoreCount: 5 }))).toBe(true);
    expect(evaluateCriterion(c, baseState({ rxScoreCount: 4 }))).toBe(false);
  });
});

describe("evaluateCriterion · ratio_pr", () => {
  const c: Criterion = { type: "ratio_pr", movement: "Deadlift", ratio: 2 };
  it("unlocks when PR >= bodyweight × ratio", () => {
    expect(
      evaluateCriterion(
        c,
        baseState({ bodyweightKg: 80, prByMovement: { deadlift: 160 } }),
      ),
    ).toBe(true);
  });
  it("locked when below ratio", () => {
    expect(
      evaluateCriterion(
        c,
        baseState({ bodyweightKg: 80, prByMovement: { deadlift: 150 } }),
      ),
    ).toBe(false);
  });
  it("locked when bodyweight unknown", () => {
    expect(
      evaluateCriterion(c, baseState({ prByMovement: { deadlift: 200 } })),
    ).toBe(false);
  });
  it("case-insensitive movement match", () => {
    expect(
      evaluateCriterion(
        { type: "ratio_pr", movement: "DEADLIFT", ratio: 2 },
        baseState({ bodyweightKg: 70, prByMovement: { deadlift: 150 } }),
      ),
    ).toBe(true);
  });
});

describe("isCriterion guard", () => {
  it("accepts known shapes", () => {
    expect(isCriterion({ type: "attendance", count: 1 })).toBe(true);
    expect(isCriterion({ type: "ratio_pr", movement: "X", ratio: 1 })).toBe(
      true,
    );
  });
  it("rejects malformed input", () => {
    expect(isCriterion(null)).toBe(false);
    expect(isCriterion({ type: "unknown" })).toBe(false);
    expect(isCriterion({ type: "attendance" })).toBe(false);
    expect(isCriterion({ type: "ratio_pr", movement: "X" })).toBe(false);
  });
});

describe("triggerMatchesType", () => {
  it("ATTENDANCE only fires attendance kinds", () => {
    expect(triggerMatchesType("ATTENDANCE", "attendance")).toBe(true);
    expect(triggerMatchesType("ATTENDANCE", "attendance_streak")).toBe(true);
    expect(triggerMatchesType("ATTENDANCE", "pr")).toBe(false);
    expect(triggerMatchesType("ATTENDANCE", "rx_count")).toBe(false);
  });
  it("PR fires pr/rx/ratio_pr", () => {
    expect(triggerMatchesType("PR", "pr")).toBe(true);
    expect(triggerMatchesType("PR", "rx_count")).toBe(true);
    expect(triggerMatchesType("PR", "ratio_pr")).toBe(true);
    expect(triggerMatchesType("PR", "attendance")).toBe(false);
  });
  it("BULK / BACKFILL fires every kind", () => {
    for (const t of ["BULK", "BACKFILL"] as const) {
      expect(triggerMatchesType(t, "attendance")).toBe(true);
      expect(triggerMatchesType(t, "ratio_pr")).toBe(true);
    }
  });
});

describe("xpForBadgeCode", () => {
  it("returns predefined values for known badges", () => {
    expect(xpForBadgeCode("first-class")).toBe(10);
    expect(xpForBadgeCode("first-pr")).toBe(50);
    expect(xpForBadgeCode("streak-7")).toBe(25);
    expect(xpForBadgeCode("streak-30")).toBe(75);
    expect(xpForBadgeCode("double-bw-deadlift")).toBe(100);
  });
  it("falls back to 25 for unknown codes", () => {
    expect(xpForBadgeCode("brand-new-badge")).toBe(25);
  });
});
