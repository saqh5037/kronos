export const SKILL_PROGRESSION_XP = 100;

export const SKILL_XP_LEDGER_REASON = "skill_progression_achieved";
export const SKILL_XP_LEDGER_SOURCE_TYPE = "skill_progression";

export function buildSkillXPLedgerSourceId(
  movementSlug: string,
  progressionSlug: string,
): string {
  return `${movementSlug}:${progressionSlug}`;
}
