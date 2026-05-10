import { describe, it, expect } from "vitest";
import {
  buildCatalog,
  computeCatalogSkillStatus,
  computeSkillProgressTotals,
  isSkillCompleted,
  isSkillStarted,
  levelToTier,
  selectActiveSkillId,
} from "@/lib/skills/progress";
import type { Skill } from "@/lib/skills/types";
import type { AthleteLevel } from "@/lib/skill-tree";

function level(
  movementSlug: string,
  progressionSlug: string,
  status: "CURRENT" | "ACHIEVED",
): AthleteLevel {
  return { movementSlug, progressionSlug, status, achievedAt: null };
}

const skills: readonly Skill[] = [
  {
    id: "ring-dip",
    name: "Ring Dip",
    tier: "principiante",
    movementSlug: "ring-dip",
    prereqSkillIds: [],
  },
  {
    id: "muscle-up-ring",
    name: "Muscle-Up (anillas)",
    tier: "rx",
    movementSlug: "muscle-up-ring",
    prereqSkillIds: ["ring-dip"],
  },
  {
    id: "handstand-walk",
    name: "Handstand Walk",
    tier: "escalado",
    movementSlug: "handstand-walk",
    prereqSkillIds: [],
  },
];

describe("levelToTier", () => {
  it("maps Athlete.tags level → SkillTier", () => {
    expect(levelToTier("rx")).toBe("rx");
    expect(levelToTier("scaled")).toBe("escalado");
    expect(levelToTier("beginner")).toBe("principiante");
    expect(levelToTier(null)).toBe("principiante");
  });
});

describe("computeSkillProgressTotals", () => {
  it("returns 0% when no levels", () => {
    expect(computeSkillProgressTotals([], "ring-dip", 5)).toEqual({
      progressPercent: 0,
      achievedCount: 0,
      totalCount: 5,
    });
  });

  it("returns 50% when half achieved", () => {
    const levels = [
      level("ring-dip", "p1", "ACHIEVED"),
      level("ring-dip", "p2", "ACHIEVED"),
      level("ring-dip", "p3", "CURRENT"),
    ];
    expect(computeSkillProgressTotals(levels, "ring-dip", 4)).toEqual({
      progressPercent: 50,
      achievedCount: 2,
      totalCount: 4,
    });
  });

  it("returns 100% when all achieved", () => {
    const levels = [
      level("ring-dip", "p1", "ACHIEVED"),
      level("ring-dip", "p2", "ACHIEVED"),
    ];
    expect(computeSkillProgressTotals(levels, "ring-dip", 2)).toEqual({
      progressPercent: 100,
      achievedCount: 2,
      totalCount: 2,
    });
  });

  it("returns zeros when totalProgressions is 0", () => {
    expect(computeSkillProgressTotals([], "x", 0)).toEqual({
      progressPercent: 0,
      achievedCount: 0,
      totalCount: 0,
    });
  });

  it("ignores levels of other movements", () => {
    const levels = [
      level("other", "p1", "ACHIEVED"),
      level("ring-dip", "p1", "ACHIEVED"),
    ];
    expect(
      computeSkillProgressTotals(levels, "ring-dip", 4).achievedCount,
    ).toBe(1);
  });
});

describe("isSkillCompleted / isSkillStarted", () => {
  it("isSkillCompleted true when all achieved", () => {
    const levels = [
      level("ring-dip", "p1", "ACHIEVED"),
      level("ring-dip", "p2", "ACHIEVED"),
    ];
    expect(isSkillCompleted(levels, "ring-dip", 2)).toBe(true);
  });

  it("isSkillCompleted false when partial", () => {
    const levels = [level("ring-dip", "p1", "ACHIEVED")];
    expect(isSkillCompleted(levels, "ring-dip", 2)).toBe(false);
  });

  it("isSkillCompleted false when totalProgressions is 0", () => {
    expect(isSkillCompleted([], "ring-dip", 0)).toBe(false);
  });

  it("isSkillStarted true with any level", () => {
    expect(
      isSkillStarted([level("ring-dip", "p1", "CURRENT")], "ring-dip"),
    ).toBe(true);
  });

  it("isSkillStarted false without any level", () => {
    expect(isSkillStarted([], "ring-dip")).toBe(false);
  });
});

describe("selectActiveSkillId", () => {
  const totals = new Map([
    ["ring-dip", 4],
    ["muscle-up-ring", 5],
    ["handstand-walk", 6],
  ]);

  it("returns null when no levels", () => {
    expect(selectActiveSkillId(skills, [], totals)).toBeNull();
  });

  it("returns null when all skills completed", () => {
    const levels = [
      level("ring-dip", "p1", "ACHIEVED"),
      level("ring-dip", "p2", "ACHIEVED"),
      level("ring-dip", "p3", "ACHIEVED"),
      level("ring-dip", "p4", "ACHIEVED"),
    ];
    expect(selectActiveSkillId([skills[0]!], levels, totals)).toBeNull();
  });

  it("prefers skill with CURRENT progression", () => {
    const levels = [
      level("ring-dip", "p1", "ACHIEVED"),
      level("handstand-walk", "p1", "CURRENT"),
    ];
    expect(selectActiveSkillId(skills, levels, totals)).toBe("handstand-walk");
  });

  it("returns first started not-completed skill if no CURRENT", () => {
    const levels = [level("ring-dip", "p1", "ACHIEVED")];
    expect(selectActiveSkillId(skills, levels, totals)).toBe("ring-dip");
  });
});

describe("computeCatalogSkillStatus", () => {
  it("locks skills above athlete tier", () => {
    const result = computeCatalogSkillStatus({
      skill: skills[1]!,
      athleteLevels: [],
      athleteTier: "principiante",
      completedSkillIds: new Set(),
      activeSkillId: null,
      totalProgressions: 5,
    });
    expect(result.status).toBe("locked");
    expect(result.lockReason).toBe("Nivel RX");
  });

  it("locks skills with missing prereq", () => {
    const result = computeCatalogSkillStatus({
      skill: skills[1]!,
      athleteLevels: [],
      athleteTier: "rx",
      completedSkillIds: new Set(),
      activeSkillId: null,
      totalProgressions: 5,
    });
    expect(result.status).toBe("locked");
    expect(result.lockReason).toContain("Ring Dip");
  });

  it("returns completed when all progressions achieved", () => {
    const levels = [
      level("ring-dip", "p1", "ACHIEVED"),
      level("ring-dip", "p2", "ACHIEVED"),
    ];
    const result = computeCatalogSkillStatus({
      skill: skills[0]!,
      athleteLevels: levels,
      athleteTier: "rx",
      completedSkillIds: new Set(),
      activeSkillId: null,
      totalProgressions: 2,
    });
    expect(result.status).toBe("completed");
    expect(result.progressPercent).toBe(100);
  });

  it("returns active for the selected active skill", () => {
    const levels = [level("ring-dip", "p1", "ACHIEVED")];
    const result = computeCatalogSkillStatus({
      skill: skills[0]!,
      athleteLevels: levels,
      athleteTier: "rx",
      completedSkillIds: new Set(),
      activeSkillId: "ring-dip",
      totalProgressions: 4,
    });
    expect(result.status).toBe("active");
    expect(result.progressPercent).toBe(25);
  });

  it("returns available when not started and unlocked", () => {
    const result = computeCatalogSkillStatus({
      skill: skills[0]!,
      athleteLevels: [],
      athleteTier: "rx",
      completedSkillIds: new Set(),
      activeSkillId: null,
      totalProgressions: 4,
    });
    expect(result.status).toBe("available");
    expect(result.progressPercent).toBeUndefined();
  });
});

describe("buildCatalog", () => {
  const totals = new Map([
    ["ring-dip", 4],
    ["muscle-up-ring", 5],
    ["handstand-walk", 6],
  ]);

  it("builds full catalog with mixed states for principiante", () => {
    const levels = [
      level("ring-dip", "p1", "ACHIEVED"),
      level("ring-dip", "p2", "CURRENT"),
    ];
    const catalog = buildCatalog({
      skills,
      athleteLevels: levels,
      athleteTier: "principiante",
      totalsByMovementSlug: totals,
    });
    expect(catalog).toHaveLength(3);
    expect(catalog[0]).toEqual({
      id: "ring-dip",
      name: "Ring Dip",
      status: "active",
      progressPercent: 25,
      lockReason: undefined,
    });
    expect(catalog[1]?.status).toBe("locked");
    expect(catalog[1]?.lockReason).toBe("Nivel RX");
    expect(catalog[2]?.status).toBe("locked");
    expect(catalog[2]?.lockReason).toBe("Nivel Escalado");
  });

  it("unlocks prereq when prerequisite skill is completed", () => {
    const levels = [
      level("ring-dip", "p1", "ACHIEVED"),
      level("ring-dip", "p2", "ACHIEVED"),
      level("ring-dip", "p3", "ACHIEVED"),
      level("ring-dip", "p4", "ACHIEVED"),
    ];
    const catalog = buildCatalog({
      skills,
      athleteLevels: levels,
      athleteTier: "rx",
      totalsByMovementSlug: totals,
    });
    expect(catalog[0]?.status).toBe("completed");
    expect(catalog[1]?.status).toBe("available");
  });
});
