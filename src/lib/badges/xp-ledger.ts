/**
 * Pure XP-ledger math (audit 2026-09-15, systemic issue S10: "LOGROS · 0 XP"
 * printed directly above four unlocked badges).
 *
 * The ledger is the only XP source in the product. Achievements created outside
 * `runAchievementEvaluation` — the seed, historical backfills — never got their
 * ledger row, so the balance disagreed with the badges on screen. This module
 * decides which rows are missing; `src/server/achievements/xp.ts` writes them.
 *
 * No DB, no Prisma: it takes the badges the athlete owns and the ledger keys
 * that already exist.
 */

import { xpForBadgeCode } from "@/server/achievements/criteria";

export const BADGE_XP_SOURCE_TYPE = "Achievement";

export function badgeXPReason(code: string): string {
  return `BADGE_${code}`;
}

export type OwnedBadge = {
  badgeId: string;
  code: string;
  xpReward?: number | null;
};

export type BadgeXPEntry = {
  sourceId: string;
  reason: string;
  amount: number;
};

/**
 * Which ledger rows are missing for the badges this athlete owns.
 *
 * `existingSourceIds` are the `sourceId`s already in the ledger under
 * `sourceType = "Achievement"`. Duplicated input badges collapse to one entry,
 * so a bad join can never double-credit.
 */
export function missingBadgeXPEntries(
  ownedBadges: readonly OwnedBadge[],
  existingSourceIds: readonly string[],
): BadgeXPEntry[] {
  const existing = new Set(existingSourceIds);
  const seen = new Set<string>();
  const out: BadgeXPEntry[] = [];

  for (const badge of ownedBadges) {
    if (existing.has(badge.badgeId) || seen.has(badge.badgeId)) continue;
    seen.add(badge.badgeId);
    const amount = badge.xpReward ?? xpForBadgeCode(badge.code);
    if (amount <= 0) continue;
    out.push({
      sourceId: badge.badgeId,
      reason: badgeXPReason(badge.code),
      amount,
    });
  }

  return out;
}

/** Total XP from a set of ledger amounts. */
export function sumXP(amounts: readonly number[]): number {
  return amounts.reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);
}
