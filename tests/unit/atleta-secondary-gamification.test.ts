/**
 * Gamification coherence (audit 2026-09-15, systemic issue S10).
 *
 * Regression targets, all quoted from the audit:
 *  - "17 / 1 clases · 100 %"
 *  - "30 días seguidos" at 0 % while the athlete is on day 7 (should be 23 %)
 *  - unlocked and locked badges rendering the same two-letter text code
 *  - "LOGROS · 0 XP" above four unlocked badges
 *  - a "PRINCIPIANTE" chip on every athlete, declared or not
 */

import { describe, it, expect } from "vitest";
import {
  badgeCelebrationCopy,
  badgeIconName,
  badgeProgressHuman,
  badgeProgressView,
} from "@/lib/badges/progress";
import { computeAthleteTier, skillTierLabel } from "@/lib/skills/progress";
import { missingBadgeXPEntries, sumXP } from "@/lib/badges/xp-ledger";
import { streakFromBookings } from "@/lib/streak";

describe("badgeProgressView · clamping", () => {
  it("a 30-day streak badge on day 7 reads 23 %", () => {
    const view = badgeProgressView(7, 30);
    expect(view.percent).toBe(23);
    expect(view.complete).toBe(false);
    expect(badgeProgressHuman(7, 30, "días")).toBe("7 / 30 días");
  });

  it("never prints more than the target (the '17 / 1 clases' bug)", () => {
    expect(badgeProgressHuman(17, 1, "clases")).toBe("1 / 1 clases");
    expect(badgeProgressView(17, 1).percent).toBe(100);
    expect(badgeProgressView(17, 1).complete).toBe(true);
  });

  it("treats a missing target as 'not measurable' instead of NaN", () => {
    const view = badgeProgressView(80, 0);
    expect(view.percent).toBe(0);
    expect(view.ratio).toBe(0);
    expect(Number.isNaN(view.ratio)).toBe(false);
    expect(badgeProgressHuman(80, 0, "kg")).toBe("kg");
  });

  it("clamps negative and non-finite counters to zero", () => {
    expect(badgeProgressView(-3, 10).percent).toBe(0);
    expect(badgeProgressView(Number.NaN, 10).percent).toBe(0);
  });

  it("keeps one decimal for fractional targets (bodyweight ratios)", () => {
    expect(badgeProgressHuman(120.5, 148.4, "kg")).toBe("120.5 / 148.4 kg");
  });
});

describe("badgeIconName", () => {
  it("maps every seeded badge code to a lucide icon", () => {
    const seeded = [
      "first-class",
      "streak-7",
      "streak-30",
      "first-pr",
      "rx-warrior",
      "double-bw-deadlift",
      "first-strict-pull-up",
      "first-muscle-up-bar",
      "first-strict-hspu",
      "first-pistol",
      "first-double-under",
    ];
    for (const code of seeded) {
      expect(badgeIconName(code)).not.toBe("Award");
    }
  });

  it("falls back to a glyph (never initials) for unknown codes", () => {
    expect(badgeIconName("brand-new-badge")).toBe("Award");
  });
});

describe("badgeCelebrationCopy", () => {
  it("does not congratulate a first class with PR copy", () => {
    const copy = badgeCelebrationCopy("first-class", "Primera clase");
    expect(copy).not.toMatch(/PR/);
    expect(copy).toMatch(/primera clase/i);
  });

  it("uses the badge name for unseeded codes", () => {
    expect(badgeCelebrationCopy("unknown", "Mi logro")).toContain("Mi logro");
  });
});

describe("missingBadgeXPEntries · one ledger, one XP number", () => {
  it("credits unlocked badges that never got a ledger row", () => {
    const entries = missingBadgeXPEntries(
      [
        { badgeId: "b1", code: "first-class" },
        { badgeId: "b2", code: "first-pr" },
      ],
      [],
    );
    expect(entries).toEqual([
      { sourceId: "b1", reason: "BADGE_first-class", amount: 10 },
      { sourceId: "b2", reason: "BADGE_first-pr", amount: 50 },
    ]);
    expect(sumXP(entries.map((e) => e.amount))).toBe(60);
  });

  it("is idempotent — already-credited badges are skipped", () => {
    const entries = missingBadgeXPEntries(
      [
        { badgeId: "b1", code: "first-class" },
        { badgeId: "b2", code: "first-pr" },
      ],
      ["b1"],
    );
    expect(entries.map((e) => e.sourceId)).toEqual(["b2"]);
  });

  it("never double-credits a duplicated badge row", () => {
    const entries = missingBadgeXPEntries(
      [
        { badgeId: "b1", code: "first-class" },
        { badgeId: "b1", code: "first-class" },
      ],
      [],
    );
    expect(entries).toHaveLength(1);
  });

  it("honours a per-badge xpReward override", () => {
    const entries = missingBadgeXPEntries(
      [{ badgeId: "b1", code: "first-class", xpReward: 250 }],
      [],
    );
    expect(entries[0]?.amount).toBe(250);
  });

  it("skips zero/negative rewards", () => {
    expect(
      missingBadgeXPEntries([{ badgeId: "b1", code: "x", xpReward: 0 }], []),
    ).toEqual([]);
  });
});

describe("streakFromBookings · real progress, not the cached counter", () => {
  const now = new Date("2026-09-15T12:00:00.000Z");
  const day = (iso: string) => new Date(`${iso}T06:00:00.000Z`);

  it("counts consecutive attendance days ending today", () => {
    const rows = [
      "2026-09-15",
      "2026-09-14",
      "2026-09-13",
      "2026-09-12",
      "2026-09-11",
      "2026-09-10",
      "2026-09-09",
    ].map((d) => ({ checkedInAt: day(d), class: null }));
    expect(streakFromBookings(rows, now)).toBe(7);
  });

  it("falls back to the class start when check-in was never recorded", () => {
    const rows = [
      { checkedInAt: null, class: { startsAt: day("2026-09-15") } },
      { checkedInAt: null, class: { startsAt: day("2026-09-14") } },
    ];
    expect(streakFromBookings(rows, now)).toBe(2);
  });

  it("returns 0 when attendance stopped more than a day ago", () => {
    const rows = [{ checkedInAt: day("2026-09-01"), class: null }];
    expect(streakFromBookings(rows, now)).toBe(0);
  });

  it("ignores rows with neither check-in nor class", () => {
    expect(streakFromBookings([{ checkedInAt: null, class: null }], now)).toBe(
      0,
    );
  });
});

describe("computeAthleteTier · no default PRINCIPIANTE chip", () => {
  it("is unknown when nothing was declared or earned", () => {
    const info = computeAthleteTier({ declaredLevel: null });
    expect(info.known).toBe(false);
    expect(info.source).toBe("default");
    expect(info.tier).toBe("principiante");
  });

  it("is known when the athlete declared a level", () => {
    expect(computeAthleteTier({ declaredLevel: "beginner" })).toEqual({
      tier: "principiante",
      known: true,
      source: "declared",
    });
    expect(computeAthleteTier({ declaredLevel: "rx" }).tier).toBe("rx");
    expect(computeAthleteTier({ declaredLevel: "scaled" }).tier).toBe(
      "escalado",
    );
  });

  it("promotes on earned skills above the declared level", () => {
    const info = computeAthleteTier({
      declaredLevel: "beginner",
      completedSkillTiers: ["principiante", "rx"],
    });
    expect(info).toEqual({ tier: "rx", known: true, source: "earned" });
  });

  it("never demotes a declared level below what was earned", () => {
    const info = computeAthleteTier({
      declaredLevel: "rx",
      completedSkillTiers: ["principiante"],
    });
    expect(info.tier).toBe("rx");
  });

  it("labels tiers through the shared enum map", () => {
    expect(skillTierLabel("principiante")).toBe("Principiante");
    expect(skillTierLabel("escalado")).toBe("Escalado");
    expect(skillTierLabel("rx")).toBe("RX");
  });
});
