import type { ProgressionNode } from "@/lib/skill-tree";

export type SkillTier = "principiante" | "escalado" | "rx";

export type CatalogSkillStatus =
  | "active"
  | "available"
  | "completed"
  | "locked";

export type Skill = {
  id: string;
  name: string;
  tier: SkillTier;
  movementSlug: string;
  prereqSkillIds: string[];
};

export type CatalogSkill = {
  id: string;
  name: string;
  status: CatalogSkillStatus;
  progressPercent?: number;
  /** Short headline for a locked skill ("Pide nivel RX"). */
  lockReason?: string;
  /** Second line that resolves the ambiguity ("Tu nivel: Principiante"). */
  lockDetail?: string;
};

/**
 * The tier we may show the athlete. `known: false` means nobody declared a
 * level and nothing was earned yet, so the UI must not print a tier chip.
 */
export type AthleteTierInfo = {
  tier: SkillTier;
  known: boolean;
  source: "declared" | "earned" | "default";
};

export type ActiveSkillData = {
  skill: Skill;
  progressPercent: number;
  achievedCount: number;
  totalCount: number;
  progressions: ProgressionNode[];
};

export type SkillProgressTotals = {
  progressPercent: number;
  achievedCount: number;
  totalCount: number;
};
