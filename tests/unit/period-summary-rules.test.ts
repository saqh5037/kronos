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
