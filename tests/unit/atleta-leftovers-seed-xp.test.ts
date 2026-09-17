/**
 * Every badge a fresh seed unlocks is paid for in the XP ledger.
 *
 * Audit 2026-09-15 (systemic issue S10): the athlete home printed
 * "LOGROS · 0 XP" directly above unlocked badges. XP is the `XPLedger` sum and
 * nothing else, so an achievement created outside `runAchievementEvaluation` —
 * which is every achievement the seed creates — was an unlocked badge worth
 * nothing. `reconcileBadgeXPLedger` back-fills at read time; this pins the seed
 * so it does not need back-filling.
 *
 * The key scheme is asserted against `src/lib/badges/xp-ledger.ts` rather than
 * duplicated by hand: if either side drifts, reconciliation would either
 * double-credit the athlete or leave the badge unpaid.
 */
import { describe, it, expect } from "vitest";
import {
  badgeXPLedgerRows,
  badgeXPReason,
  BADGE_XP_SOURCE_TYPE,
  SEEDED_ACHIEVEMENTS,
} from "../../prisma/data/achievements";
import {
  badgeXPReason as appBadgeXPReason,
  BADGE_XP_SOURCE_TYPE as APP_BADGE_XP_SOURCE_TYPE,
  missingBadgeXPEntries,
} from "../../src/lib/badges/xp-ledger";

/** What `prisma/seed.ts` hands in after upserting the badges. */
const BADGES = new Map<string, { id: string; xpReward: number }>(
  (
    [
      ["first-class", 10],
      ["streak-7", 25],
      ["streak-30", 75],
      ["first-pr", 50],
      ["rx-warrior", 50],
      ["double-bw-deadlift", 100],
      ["first-strict-pull-up", 25],
      ["first-muscle-up-bar", 25],
      ["first-strict-hspu", 25],
      ["first-pistol", 25],
      ["first-double-under", 25],
    ] as Array<[string, number]>
  ).map(([code, xpReward]) => [code, { id: `badge-${code}`, xpReward }]),
);

const athleteIdAt = (index: number) => `seed-ath-${index}`;

describe("seed XP ledger", () => {
  it("shares the exact key scheme with the app's reconciler", () => {
    expect(BADGE_XP_SOURCE_TYPE).toBe(APP_BADGE_XP_SOURCE_TYPE);
    for (const code of BADGES.keys()) {
      expect(badgeXPReason(code)).toBe(appBadgeXPReason(code));
    }
  });

  it("pays for every granted achievement", () => {
    const rows = badgeXPLedgerRows(SEEDED_ACHIEVEMENTS, BADGES, athleteIdAt);
    expect(rows).toHaveLength(SEEDED_ACHIEVEMENTS.length);
    for (const row of rows) {
      expect(row.amount).toBeGreaterThan(0);
      expect(row.sourceType).toBe(BADGE_XP_SOURCE_TYPE);
    }
  });

  it("credits the athlete who earned it, with that badge's own reward", () => {
    const rows = badgeXPLedgerRows(SEEDED_ACHIEVEMENTS, BADGES, athleteIdAt);
    for (const granted of SEEDED_ACHIEVEMENTS) {
      const badge = BADGES.get(granted.badgeCode)!;
      const row = rows.find((r) => r.sourceId === badge.id);
      expect(row, granted.badgeCode).toBeDefined();
      expect(row!.athleteId).toBe(athleteIdAt(granted.athleteIndex));
      expect(row!.amount).toBe(badge.xpReward);
      expect(row!.reason).toBe(badgeXPReason(granted.badgeCode));
    }
  });

  it("grants every badge to at most one athlete", () => {
    // `XPLedger` is unique on (sourceType, sourceId, reason) and NOT on
    // athlete, so a second owner of the same badge could never be credited.
    // See the header of prisma/data/achievements.ts.
    const perBadge = new Map<string, number>();
    for (const granted of SEEDED_ACHIEVEMENTS) {
      perBadge.set(
        granted.badgeCode,
        (perBadge.get(granted.badgeCode) ?? 0) + 1,
      );
    }
    expect([...perBadge].filter(([, n]) => n > 1)).toEqual([]);
  });

  it("emits ledger keys that are unique under the DB constraint", () => {
    const rows = badgeXPLedgerRows(SEEDED_ACHIEVEMENTS, BADGES, athleteIdAt);
    const keys = rows.map((r) => `${r.sourceType}|${r.sourceId}|${r.reason}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("leaves the app reconciler with nothing to back-fill", () => {
    const rows = badgeXPLedgerRows(SEEDED_ACHIEVEMENTS, BADGES, athleteIdAt);

    const byAthlete = new Map<string, typeof rows>();
    for (const row of rows) {
      byAthlete.set(row.athleteId, [
        ...(byAthlete.get(row.athleteId) ?? []),
        row,
      ]);
    }

    for (const [athleteId, athleteRows] of byAthlete) {
      const owned = SEEDED_ACHIEVEMENTS.filter(
        (g) => athleteIdAt(g.athleteIndex) === athleteId,
      ).map((g) => {
        const badge = BADGES.get(g.badgeCode)!;
        return {
          badgeId: badge.id,
          code: g.badgeCode,
          xpReward: badge.xpReward,
        };
      });

      const missing = missingBadgeXPEntries(
        owned,
        athleteRows.map((r) => r.sourceId),
      );
      expect(missing, athleteId).toEqual([]);
    }
  });

  it("skips a badge with no reward, an unknown athlete and an unknown code", () => {
    const rows = badgeXPLedgerRows(
      [
        { badgeCode: "free-badge", athleteIndex: 0, daysAgo: 1 },
        { badgeCode: "first-pr", athleteIndex: 99, daysAgo: 1 },
        { badgeCode: "not-a-badge", athleteIndex: 0, daysAgo: 1 },
      ],
      new Map([
        ["free-badge", { id: "badge-free", xpReward: 0 }],
        ["first-pr", { id: "badge-first-pr", xpReward: 50 }],
      ]),
      (index) => (index === 0 ? "seed-ath-0" : undefined),
    );
    expect(rows).toEqual([]);
  });
});
