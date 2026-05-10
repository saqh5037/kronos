import type { BadgeTier } from "@prisma/client";
import type { SkillTier } from "@/lib/skills/types";

const TIER_RANK: Record<BadgeTier, number> = {
  PRINCIPIANTE: 1,
  ESCALADO: 2,
  RX: 3,
};

const SKILL_TO_BADGE_TIER: Record<SkillTier, BadgeTier> = {
  principiante: "PRINCIPIANTE",
  escalado: "ESCALADO",
  rx: "RX",
};

const BADGE_TIER_LABEL: Record<BadgeTier, string> = {
  PRINCIPIANTE: "Principiante",
  ESCALADO: "Escalado",
  RX: "RX",
};

export function badgeTierFromSkillTier(tier: SkillTier): BadgeTier {
  return SKILL_TO_BADGE_TIER[tier];
}

export function badgeTierLabel(tier: BadgeTier): string {
  return BADGE_TIER_LABEL[tier];
}

export function isBadgeAccessibleForTier(
  badgeTier: BadgeTier | null,
  athleteTier: SkillTier,
): boolean {
  if (!badgeTier) return true;
  const required = TIER_RANK[badgeTier];
  const have = TIER_RANK[SKILL_TO_BADGE_TIER[athleteTier]];
  return have >= required;
}

export function isBadgeAboveAthleteTier(
  badgeTier: BadgeTier | null,
  athleteTier: SkillTier,
): boolean {
  if (!badgeTier) return false;
  const required = TIER_RANK[badgeTier];
  const have = TIER_RANK[SKILL_TO_BADGE_TIER[athleteTier]];
  return required > have;
}
