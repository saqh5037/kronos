/**
 * One XP source of truth: the `XPLedger` table.
 *
 * Audit 2026-09-15 (systemic issue S10): the athlete home printed
 * "LOGROS · 0 XP" directly above four unlocked badges, while a badge detail
 * page promised "+50 XP". Both screens already read the same ledger — the
 * contradiction was in the data: `runAchievementEvaluation` writes a ledger row
 * when it grants a badge, but achievements created outside that path (the seed,
 * and any historical backfill) never got one.
 *
 * So instead of adding a second XP source, the read paths reconcile: any
 * unlocked achievement without its ledger row gets one, idempotently
 * (`XPLedger @@unique([sourceType, sourceId, reason])`). After that every XP
 * number in the product is the ledger sum and nothing else.
 *
 * The decision of *which* rows are missing is pure and lives in
 * `@/lib/badges/xp-ledger`.
 */

import { withTenant, db as prismaBase } from "@/server/db";
import {
  BADGE_XP_SOURCE_TYPE,
  missingBadgeXPEntries,
} from "@/lib/badges/xp-ledger";

export {
  BADGE_XP_SOURCE_TYPE,
  badgeXPReason,
  missingBadgeXPEntries,
  sumXP,
} from "@/lib/badges/xp-ledger";
export type { BadgeXPEntry, OwnedBadge } from "@/lib/badges/xp-ledger";

/**
 * Backfill the ledger rows the athlete's unlocked badges should have had, then
 * return the authoritative total. Safe to call on every read: the unique
 * constraint makes each insert idempotent, and a fully reconciled athlete
 * performs no writes at all.
 */
export async function reconcileBadgeXPLedger(
  tenantId: string,
  athleteId: string,
): Promise<number> {
  const db = withTenant(tenantId);

  const [achievements, ledgerRows] = await Promise.all([
    db.achievement.findMany({
      where: { athleteId },
      select: { badge: { select: { id: true, code: true, xpReward: true } } },
    }),
    prismaBase.xPLedger.findMany({
      where: { tenantId, athleteId, sourceType: BADGE_XP_SOURCE_TYPE },
      select: { sourceId: true },
    }),
  ]);

  const missing = missingBadgeXPEntries(
    achievements.map((a) => ({
      badgeId: a.badge.id,
      code: a.badge.code,
      xpReward: a.badge.xpReward,
    })),
    ledgerRows.map((r) => r.sourceId),
  );

  if (missing.length > 0) {
    await prismaBase.xPLedger.createMany({
      data: missing.map((m) => ({
        tenantId,
        athleteId,
        amount: m.amount,
        reason: m.reason,
        sourceType: BADGE_XP_SOURCE_TYPE,
        sourceId: m.sourceId,
      })),
      skipDuplicates: true,
    });
  }

  const total = await prismaBase.xPLedger.aggregate({
    where: { tenantId, athleteId },
    _sum: { amount: true },
  });
  return total._sum.amount ?? 0;
}
