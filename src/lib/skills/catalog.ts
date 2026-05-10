import type { Skill } from "./types";

export const SKILL_CATALOG: readonly Skill[] = [
  {
    id: "double-under",
    name: "Double-Under",
    tier: "principiante",
    movementSlug: "double-under",
    prereqSkillIds: [],
  },
  {
    id: "toes-to-bar",
    name: "Toes-to-Bar",
    tier: "principiante",
    movementSlug: "toes-to-bar",
    prereqSkillIds: [],
  },
  {
    id: "ring-dip",
    name: "Ring Dip",
    tier: "principiante",
    movementSlug: "ring-dip",
    prereqSkillIds: [],
  },
  {
    id: "pistol-squat",
    name: "Pistol Squat",
    tier: "principiante",
    movementSlug: "pistol-squat",
    prereqSkillIds: [],
  },
  {
    id: "clean-and-jerk",
    name: "Clean & Jerk",
    tier: "escalado",
    movementSlug: "clean-and-jerk",
    prereqSkillIds: [],
  },
  {
    id: "handstand-push-up",
    name: "HSPU",
    tier: "escalado",
    movementSlug: "handstand-push-up",
    prereqSkillIds: [],
  },
  {
    id: "handstand-walk",
    name: "Handstand Walk",
    tier: "escalado",
    movementSlug: "handstand-walk",
    prereqSkillIds: ["handstand-push-up"],
  },
  {
    id: "muscle-up-ring",
    name: "Muscle-Up (anillas)",
    tier: "rx",
    movementSlug: "muscle-up-ring",
    prereqSkillIds: ["ring-dip"],
  },
  {
    id: "muscle-up-bar",
    name: "Muscle-Up (barra)",
    tier: "rx",
    movementSlug: "muscle-up-bar",
    prereqSkillIds: ["muscle-up-ring"],
  },
  {
    id: "snatch",
    name: "Snatch",
    tier: "rx",
    movementSlug: "snatch",
    prereqSkillIds: ["clean-and-jerk"],
  },
] as const;

export function getSkillById(id: string): Skill | undefined {
  return SKILL_CATALOG.find((s) => s.id === id);
}

export function getSkillByMovementSlug(slug: string): Skill | undefined {
  return SKILL_CATALOG.find((s) => s.movementSlug === slug);
}

export function getCatalogMovementSlugs(): string[] {
  return SKILL_CATALOG.map((s) => s.movementSlug);
}
