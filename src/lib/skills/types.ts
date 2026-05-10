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
  lockReason?: string;
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
