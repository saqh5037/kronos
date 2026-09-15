/**
 * The badges a fresh seed hands out, and the XP ledger rows that pay for them.
 *
 * Audit 2026-09-15 (systemic issue S10): the athlete home printed
 * "LOGROS · 0 XP" directly above unlocked badges. XP is the `XPLedger` sum and
 * nothing else, but `runAchievementEvaluation` is the only path that writes a
 * ledger row — so any achievement created outside it (the seed, a backfill) was
 * an unlocked badge worth nothing. `reconcileBadgeXPLedger` back-fills those
 * rows at read time, and this module makes the seed correct in the first place:
 * the achievement and its ledger row are ONE record here, so they cannot drift.
 *
 * ── Why one athlete per badge ──────────────────────────────────────────────
 * `XPLedger` is unique on `(sourceType, sourceId, reason)` — NOT on athlete.
 * `reconcileBadgeXPLedger` keys a badge row as
 * `("Achievement", <badgeId>, "BADGE_<code>")`, so the constraint allows that
 * key exactly ONCE per box, for one athlete. Two athletes owning the same badge
 * is therefore not representable today (reported to the caller; fixing it needs
 * an `achievementId`-keyed ledger and a migration). The seed stays inside what
 * the schema can express: each badge below is granted to exactly one athlete.
 */

/** Mirrors `BADGE_XP_SOURCE_TYPE` in `src/lib/badges/xp-ledger.ts`. */
export const BADGE_XP_SOURCE_TYPE = "Achievement";

/** Mirrors `badgeXPReason` in `src/lib/badges/xp-ledger.ts`. */
export function badgeXPReason(code: string): string {
  return `BADGE_${code}`;
}

export type SeededAchievement = {
  /** `Badge.code` — resolved to a `Badge.id` at seed time. */
  badgeCode: string;
  /** Index into the seeded athlete list. 0 is `atleta@iron-hands.demo`. */
  athleteIndex: number;
  /** How long ago the badge was earned, so the Logros timeline is not flat. */
  daysAgo: number;
};

/**
 * The demo athlete (index 0) carries the progression an onboarded athlete would
 * actually have; the rest are spread out so the box leaderboard is not a single
 * decorated athlete.
 */
export const SEEDED_ACHIEVEMENTS: SeededAchievement[] = [
  { badgeCode: "first-class", athleteIndex: 0, daysAgo: 120 },
  { badgeCode: "first-pr", athleteIndex: 0, daysAgo: 96 },
  { badgeCode: "streak-7", athleteIndex: 0, daysAgo: 42 },
  { badgeCode: "first-double-under", athleteIndex: 0, daysAgo: 30 },
  { badgeCode: "first-strict-pull-up", athleteIndex: 1, daysAgo: 64 },
  { badgeCode: "rx-warrior", athleteIndex: 2, daysAgo: 51 },
  { badgeCode: "streak-30", athleteIndex: 3, daysAgo: 18 },
  { badgeCode: "double-bw-deadlift", athleteIndex: 4, daysAgo: 77 },
  { badgeCode: "first-pistol", athleteIndex: 5, daysAgo: 25 },
  { badgeCode: "first-muscle-up-bar", athleteIndex: 6, daysAgo: 12 },
];

export type BadgeXPLedgerRow = {
  athleteId: string;
  amount: number;
  reason: string;
  sourceType: string;
  sourceId: string;
};

/**
 * One ledger row per granted achievement, keyed exactly as
 * `reconcileBadgeXPLedger` would key it — which is what makes reconciliation a
 * no-op on a fresh seed instead of a second, conflicting credit.
 *
 * `badges` maps `Badge.code` to the row the seed just upserted. A code with no
 * badge, or a badge worth 0 XP, yields no row: the ledger never carries a
 * credit that buys nothing.
 */
export function badgeXPLedgerRows(
  achievements: readonly SeededAchievement[],
  badges: ReadonlyMap<string, { id: string; xpReward: number }>,
  athleteIdAt: (index: number) => string | undefined,
): BadgeXPLedgerRow[] {
  const rows: BadgeXPLedgerRow[] = [];
  const seen = new Set<string>();

  for (const granted of achievements) {
    const badge = badges.get(granted.badgeCode);
    const athleteId = athleteIdAt(granted.athleteIndex);
    if (!badge || !athleteId || badge.xpReward <= 0) continue;

    const key = `${BADGE_XP_SOURCE_TYPE}|${badge.id}|${badgeXPReason(granted.badgeCode)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({
      athleteId,
      amount: badge.xpReward,
      reason: badgeXPReason(granted.badgeCode),
      sourceType: BADGE_XP_SOURCE_TYPE,
      sourceId: badge.id,
    });
  }

  return rows;
}
