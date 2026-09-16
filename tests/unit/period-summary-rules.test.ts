/**
 * src/server/period-summary/rules.ts — the three rules the 2026-09-15 audit
 * found duplicated with different definitions across Pagos, Reportes, the
 * owner dashboard and Atletas (P0 #6 / S4).
 *
 * These tests are the contract: ONE definition of "active athlete", ONE
 * at-risk rule, ONE overdue ("moroso") rule, and one delta formula.
 */

import { describe, it, expect } from "vitest";
import {
  ACTIVE_ATHLETE_RULE,
  atRiskAsOf,
  AT_RISK_REASONS,
  AT_RISK_RULE,
  AT_RISK_DEFAULT_INACTIVITY_DAYS,
  OVERDUE_RULE,
  OVERDUE_DEFAULT_GRACE_DAYS,
  OVERDUE_MEMBERSHIP_STATUSES,
  deltaPct,
  evaluateAtRisk,
  isActiveAthlete,
  isMembershipOverdue,
  noShowRate,
  overdueAmountOf,
} from "../../src/server/period-summary/rules";

const NOW = new Date("2026-09-15T18:52:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000);
const daysAhead = (n: number) => new Date(NOW.getTime() + n * 86400000);

describe("rule documentation", () => {
  it("ships a human-readable statement of every rule", () => {
    expect(ACTIVE_ATHLETE_RULE.length).toBeGreaterThan(20);
    expect(AT_RISK_RULE.length).toBeGreaterThan(20);
    expect(OVERDUE_RULE.length).toBeGreaterThan(20);
  });

  it("uses 14 days of inactivity and zero grace days by default", () => {
    expect(AT_RISK_DEFAULT_INACTIVITY_DAYS).toBe(14);
    expect(OVERDUE_DEFAULT_GRACE_DAYS).toBe(0);
  });
});

describe("isActiveAthlete", () => {
  it("counts an athlete as active only when Athlete.status is ACTIVE", () => {
    expect(isActiveAthlete({ status: "ACTIVE" })).toBe(true);
    expect(isActiveAthlete({ status: "PAUSED" })).toBe(false);
    expect(isActiveAthlete({ status: "DROPIN" })).toBe(false);
    expect(isActiveAthlete({ status: "CANCELLED" })).toBe(false);
  });
});

describe("isMembershipOverdue", () => {
  it("flags ACTIVE, PENDING and EXPIRED memberships past their endDate", () => {
    for (const status of OVERDUE_MEMBERSHIP_STATUSES) {
      expect(
        isMembershipOverdue({ status, endDate: daysAgo(1) }, NOW),
        `${status} should be overdue`,
      ).toBe(true);
    }
  });

  it("never flags PAUSED or CANCELLED memberships", () => {
    expect(
      isMembershipOverdue({ status: "PAUSED", endDate: daysAgo(40) }, NOW),
    ).toBe(false);
    expect(
      isMembershipOverdue({ status: "CANCELLED", endDate: daysAgo(40) }, NOW),
    ).toBe(false);
  });

  it("does not flag a membership that is still running", () => {
    expect(
      isMembershipOverdue({ status: "ACTIVE", endDate: daysAhead(1) }, NOW),
    ).toBe(false);
  });

  it("does not flag an open-ended membership", () => {
    expect(isMembershipOverdue({ status: "ACTIVE", endDate: null }, NOW)).toBe(
      false,
    );
  });

  it("respects the grace window", () => {
    expect(
      isMembershipOverdue({ status: "ACTIVE", endDate: daysAgo(2) }, NOW, 3),
    ).toBe(false);
    expect(
      isMembershipOverdue({ status: "ACTIVE", endDate: daysAgo(4) }, NOW, 3),
    ).toBe(true);
  });
});

describe("overdueAmountOf", () => {
  it("sums the pending payments of the membership", () => {
    expect(
      overdueAmountOf({ pendingAmounts: [250, 250], planPrice: 2500 }),
    ).toBe(500);
  });

  it("falls back to the plan price when nothing is pending", () => {
    expect(overdueAmountOf({ pendingAmounts: [], planPrice: 2500 })).toBe(2500);
  });

  it("returns zero when there is neither a pending payment nor a price", () => {
    expect(overdueAmountOf({ pendingAmounts: [], planPrice: 0 })).toBe(0);
  });
});

describe("evaluateAtRisk", () => {
  it("flags an active athlete who has not attended in 14+ days", () => {
    const r = evaluateAtRisk(
      { createdAt: daysAgo(120), lastAttendedAt: daysAgo(20) },
      NOW,
    );
    expect(r.atRisk).toBe(true);
    expect(r.reasons).toContain("inactivity");
    expect(r.daysSinceLastAttendance).toBe(20);
  });

  it("does not flag an athlete who trained this week", () => {
    const r = evaluateAtRisk(
      { createdAt: daysAgo(120), lastAttendedAt: daysAgo(3) },
      NOW,
    );
    expect(r.atRisk).toBe(false);
    expect(r.reasons).toEqual([]);
  });

  it("flags an athlete who never attended and is past the grace window", () => {
    const r = evaluateAtRisk(
      { createdAt: daysAgo(30), lastAttendedAt: null },
      NOW,
    );
    expect(r.atRisk).toBe(true);
    expect(r.reasons).toContain("never_attended");
    expect(r.daysSinceLastAttendance).toBeNull();
  });

  it("gives a brand-new athlete the benefit of the doubt", () => {
    const r = evaluateAtRisk(
      { createdAt: daysAgo(2), lastAttendedAt: null },
      NOW,
    );
    expect(r.atRisk).toBe(false);
  });

  it("flags an athlete with an overdue membership even if they trained today", () => {
    const r = evaluateAtRisk(
      {
        createdAt: daysAgo(120),
        lastAttendedAt: NOW,
        hasOverdueMembership: true,
      },
      NOW,
    );
    expect(r.atRisk).toBe(true);
    expect(r.reasons).toEqual(["overdue"]);
  });

  it("accumulates both reasons when both signals fire", () => {
    const r = evaluateAtRisk(
      {
        createdAt: daysAgo(120),
        lastAttendedAt: daysAgo(40),
        hasOverdueMembership: true,
      },
      NOW,
    );
    expect(r.reasons).toEqual(["inactivity", "overdue"]);
    expect(r.severity).toBe("high");
  });

  it("respects a custom inactivity window", () => {
    const athlete = { createdAt: daysAgo(120), lastAttendedAt: daysAgo(20) };
    expect(evaluateAtRisk(athlete, NOW, 30).atRisk).toBe(false);
    expect(evaluateAtRisk(athlete, NOW, 7).atRisk).toBe(true);
  });

  it("escalates severity with the length of the absence", () => {
    expect(
      evaluateAtRisk(
        { createdAt: daysAgo(120), lastAttendedAt: daysAgo(15) },
        NOW,
      ).severity,
    ).toBe("low");
    expect(
      evaluateAtRisk(
        { createdAt: daysAgo(120), lastAttendedAt: daysAgo(35) },
        NOW,
      ).severity,
    ).toBe("med");
    expect(
      evaluateAtRisk({ createdAt: daysAgo(200), lastAttendedAt: null }, NOW)
        .severity,
    ).toBe("high");
  });
});

/**
 * `ChurnRiskTable` printed "ALTO · 2/4" over a rule that has three signals:
 * the denominator was a literal nobody updated when the fourth signal was
 * dropped (audit follow-up P1-11). It now comes from this array, so the union
 * and the screen can never disagree again.
 */
describe("AT_RISK_REASONS", () => {
  it("lists every member of the AtRiskReason union, once", () => {
    expect([...AT_RISK_REASONS].sort()).toEqual([
      "inactivity",
      "never_attended",
      "overdue",
    ]);
    expect(new Set(AT_RISK_REASONS).size).toBe(AT_RISK_REASONS.length);
  });

  it("is the denominator a screen can show: no evaluation ever exceeds it", () => {
    const worst = evaluateAtRisk(
      {
        createdAt: daysAgo(200),
        lastAttendedAt: null,
        hasOverdueMembership: true,
      },
      NOW,
    );
    expect(worst.reasons.length).toBeLessThanOrEqual(AT_RISK_REASONS.length);
    for (const reason of worst.reasons) {
      expect(AT_RISK_REASONS).toContain(reason);
    }
  });
});

describe("deltaPct", () => {
  it("returns the signed fraction of change", () => {
    expect(deltaPct(150, 100)).toBeCloseTo(0.5);
    expect(deltaPct(50, 100)).toBeCloseTo(-0.5);
  });

  it("returns 0 when both periods are empty", () => {
    expect(deltaPct(0, 0)).toBe(0);
  });

  it("returns +100% when the previous period was empty", () => {
    expect(deltaPct(1000, 0)).toBe(1);
  });

  it("returns -100% when the current period is empty", () => {
    expect(deltaPct(0, 100)).toBe(-1);
  });
});

describe("noShowRate", () => {
  it("divides no-shows by completed bookings", () => {
    expect(noShowRate({ checkins: 90, noShows: 10 })).toBeCloseTo(0.1);
  });

  it("returns 0 with no completed bookings instead of NaN", () => {
    expect(noShowRate({ checkins: 0, noShows: 0 })).toBe(0);
  });
});

/**
 * `atRiskAsOf` — the fix for the 42/42 bug.
 *
 * "En riesgo" and "moroso" are AS-OF facts, not period sums, and
 * `computePeriodSummary` evaluated them at `period.to`. For "últimos 30 días"
 * that is the end of today and everything agreed. For **"este mes"**,
 * `period.to` is the end of the CALENDAR month — a date in the future — so on
 * 16 September every athlete was "14+ days without a check-in as of 30
 * September" and /admin/reportes showed 42 of 42 at risk while the dashboard's
 * last-30-days view showed 3. Same rule, same data, two numbers: exactly the
 * S4 defect the module exists to remove.
 *
 * The clamp is the end of TODAY in the box timezone, never the raw instant:
 * clamping to `now` would make "días sin asistir" drift during the day, and
 * the whole point of evaluating at a day boundary is that the number is stable
 * and reproducible.
 */
describe("atRiskAsOf", () => {
  const TZ = "America/Mexico_City";
  // 16 Sep 2026, 13:00 in Mexico City (UTC-6) = 19:00 UTC.
  const TODAY = new Date("2026-09-16T19:00:00.000Z");
  const endOfSeptember = new Date("2026-10-01T05:59:59.999Z");
  const endOfToday = new Date("2026-09-17T05:59:59.999Z");

  it("clamps a period that ends in the future to the end of today", () => {
    const asOf = atRiskAsOf({ to: endOfSeptember, tz: TZ }, TODAY);
    expect(asOf.toISOString()).toBe(endOfToday.toISOString());
  });

  it("leaves a period that already closed at its own end", () => {
    const endOfAugust = new Date("2026-09-01T05:59:59.999Z");
    const asOf = atRiskAsOf({ to: endOfAugust, tz: TZ }, TODAY);
    expect(asOf.toISOString()).toBe(endOfAugust.toISOString());
  });

  it("is a no-op for the default last-30-days window (ends today)", () => {
    const asOf = atRiskAsOf({ to: endOfToday, tz: TZ }, TODAY);
    expect(asOf.toISOString()).toBe(endOfToday.toISOString());
  });

  it("resolves the day boundary in the BOX timezone, not the server's", () => {
    // Same instant, two boxes: 13:00 in Mexico City is 20:00 in Madrid, so
    // "end of today" is six hours apart.
    const mx = atRiskAsOf({ to: endOfSeptember, tz: TZ }, TODAY);
    const es = atRiskAsOf({ to: endOfSeptember, tz: "Europe/Madrid" }, TODAY);
    expect(mx.toISOString()).not.toBe(es.toISOString());
    expect(es.toISOString()).toBe("2026-09-16T21:59:59.999Z");
  });

  it("does not move an athlete into risk before the period they belong to", () => {
    // The athlete checked in 3 days ago. Evaluated at the end of September she
    // is 17 days idle and "at risk"; evaluated today she is not.
    const athlete = { createdAt: daysAgo(200), lastAttendedAt: daysAgo(3) };
    expect(evaluateAtRisk(athlete, endOfSeptember).atRisk).toBe(true);
    expect(
      evaluateAtRisk(athlete, atRiskAsOf({ to: endOfSeptember, tz: TZ }, NOW))
        .atRisk,
    ).toBe(false);
  });
});
