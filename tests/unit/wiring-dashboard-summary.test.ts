/**
 * The owner dashboard's KPI mapping (audit 2026-09-15, P0 #6).
 *
 * Every assertion here is a number the audit caught the dashboard getting
 * wrong. The mapping lives in a pure module precisely so these can be pinned
 * without a database, a session or a browser.
 */
import { describe, it, expect } from "vitest";
import {
  dayKeyLabel,
  dayKeyLabels,
  deltaPercent,
  mapDashboardSummary,
} from "@/app/admin/_lib/dashboard-summary";
import type { PeriodSummary } from "@/server/period-summary";

function summary(overrides: {
  paymentsByDay?: PeriodSummary["payments"]["byDay"];
  attendanceByDay?: PeriodSummary["attendance"]["byDay"];
  athletes?: Partial<PeriodSummary["athletes"]>;
  revenue?: Partial<PeriodSummary["revenue"]>;
  checkins?: number;
  label?: string;
}): PeriodSummary {
  return {
    period: {
      from: new Date("2026-08-17T00:00:00Z"),
      to: new Date("2026-09-15T23:59:59Z"),
      label: overrides.label ?? "últimos 30 días",
      tz: "America/Mexico_City",
      preset: "last30",
    },
    payments: {
      count: 33,
      paidCount: 27,
      paidTotal: 138750,
      pendingCount: 4,
      pendingTotal: 5000,
      failedCount: 2,
      failedTotal: 1200,
      byDay: overrides.paymentsByDay ?? [],
    },
    memberships: {
      active: 40,
      paused: 1,
      expired: 3,
      cancelled: 0,
      pending: 2,
      overdueCount: 4,
      overdueTotal: 9000,
      overdueRows: [],
    },
    athletes: {
      active: 42,
      newInPeriod: 5,
      atRisk: 3,
      atRiskRule: "regla",
      atRiskRows: [],
      ...overrides.athletes,
    },
    attendance: {
      checkins: overrides.checkins ?? 170,
      bookings: 200,
      noShows: 12,
      noShowRate: 0.06,
      byDay: overrides.attendanceByDay ?? [],
    },
    revenue: {
      total: 138750,
      previousTotal: 100000,
      deltaPct: 0.3875,
      ...overrides.revenue,
    },
    rules: { activeAthlete: "a", atRisk: "b", overdue: "c" },
  };
}

describe("dayKeyLabel", () => {
  it("reads a civil day key back as a civil day", () => {
    expect(dayKeyLabel("2026-09-15")).toBe("15 sep");
  });

  it("does not drift a day for a key the server would call yesterday", () => {
    // A UTC-anchored midnight formatted in a westward zone would say "31 dic".
    expect(dayKeyLabel("2026-01-01")).toBe("1 ene");
  });

  it("returns the key unchanged when it is not a day key", () => {
    expect(dayKeyLabel("not-a-date")).toBe("not-a-date");
  });

  it("labels a whole series in order", () => {
    expect(dayKeyLabels(["2026-09-14", "2026-09-15"])).toEqual([
      "14 sep",
      "15 sep",
    ]);
  });
});

describe("deltaPercent", () => {
  it("is 0 when nothing happened either period", () => {
    expect(deltaPercent(0, 0)).toBe(0);
  });

  it("is +100 % when the previous period was empty", () => {
    expect(deltaPercent(12, 0)).toBe(100);
  });

  it("is -100 % when the current period is empty", () => {
    expect(deltaPercent(0, 12)).toBe(-100);
  });

  it("reports a fall as a negative number", () => {
    expect(deltaPercent(50, 100)).toBe(-50);
  });
});

describe("mapDashboardSummary", () => {
  it("counts atletas activos from the roster, not from seats booked today", () => {
    // The audit's "27": the dashboard printed today's bookings while
    // /admin/atletas printed 42 for the same box.
    const kpis = mapDashboardSummary(summary({}));
    expect(kpis.activeAthletes).toBe(42);
  });

  it("takes en riesgo from the shared rule, never a truncated list", () => {
    const kpis = mapDashboardSummary(
      summary({ athletes: { atRisk: 7, atRiskRows: [] } }),
    );
    expect(kpis.atRiskCount).toBe(7);
  });

  it("uses the roster as the denominator of 'N de M totales'", () => {
    const kpis = mapDashboardSummary(summary({}));
    expect(kpis.atRiskTotal).toBe(42);
  });

  it("carries the period label so a number is never read without its window", () => {
    const kpis = mapDashboardSummary(summary({ label: "últimos 7 días" }));
    expect(kpis.periodLabel).toBe("últimos 7 días");
    expect(kpis.rangeLabel).toBe("ÚLTIMOS 7 DÍAS");
  });

  it("reads MRR and its two deltas off the period revenue", () => {
    const kpis = mapDashboardSummary(summary({}));
    expect(kpis.mrr).toBe(138750);
    expect(kpis.mrrDeltaPct).toBeCloseTo(38.75, 5);
    expect(kpis.mrrDeltaAbs).toBe(38750);
  });

  it("divides ARPU by active athletes, not by seats booked today", () => {
    const kpis = mapDashboardSummary(summary({}));
    expect(kpis.arpu).toBeCloseTo(138750 / 42, 5);
  });

  it("returns a null ARPU rather than dividing by an empty roster", () => {
    const kpis = mapDashboardSummary(summary({ athletes: { active: 0 } }));
    expect(kpis.arpu).toBeNull();
  });

  it("derives both x axes from the requested period's own days", () => {
    const kpis = mapDashboardSummary(
      summary({
        paymentsByDay: [
          { day: "2026-09-14", revenue: 1000, count: 2 },
          { day: "2026-09-15", revenue: 2000, count: 3 },
        ],
        attendanceByDay: [
          {
            day: "2026-09-14",
            attended: 10,
            noShow: 1,
            booked: 2,
            seats: 13,
            capacity: 20,
            classes: 2,
          },
          {
            day: "2026-09-15",
            attended: 14,
            noShow: 0,
            booked: 1,
            seats: 15,
            capacity: 20,
            classes: 2,
          },
        ],
      }),
    );
    // Never the hardcoded April axis the audit found under a 30-day label.
    expect(kpis.revenueChart.labels).toEqual(["14 sep", "15 sep"]);
    expect(kpis.revenueChart.data).toEqual([1000, 2000]);
    expect(kpis.attendanceChart.labels).toEqual(["14 sep", "15 sep"]);
    expect(kpis.attendanceChart.data).toEqual([10, 14]);
  });

  it("labels every point of the series, one label per point", () => {
    const byDay = [
      { day: "2026-09-13", revenue: 0, count: 0 },
      { day: "2026-09-14", revenue: 0, count: 0 },
      { day: "2026-09-15", revenue: 0, count: 0 },
    ];
    const kpis = mapDashboardSummary(summary({ paymentsByDay: byDay }));
    expect(kpis.revenueChart.labels).toHaveLength(
      kpis.revenueChart.data.length,
    );
  });

  it("computes the attendance delta against the previous window", () => {
    const kpis = mapDashboardSummary(summary({ checkins: 170 }), {
      previousCheckins: 100,
    });
    expect(kpis.attendanceChart.total).toBe(170);
    expect(kpis.attendanceChart.deltaPct).toBeCloseTo(70, 5);
  });

  it("reports a flat attendance delta when no previous window was given", () => {
    const kpis = mapDashboardSummary(summary({}));
    expect(kpis.attendanceChart.deltaPct).toBe(0);
  });

  it("names the at-risk rule in the note, with the inactivity window", () => {
    const kpis = mapDashboardSummary(summary({}), { inactivityDays: 21 });
    expect(kpis.atRiskNote).toContain("21");
  });

  it("has no note when nobody is at risk", () => {
    const kpis = mapDashboardSummary(summary({ athletes: { atRisk: 0 } }));
    expect(kpis.atRiskNote).toBeUndefined();
  });

  it("never turns a non-finite delta into a rendered percentage", () => {
    const kpis = mapDashboardSummary(
      summary({ revenue: { deltaPct: Number.NaN } }),
    );
    expect(kpis.mrrDeltaPct).toBe(0);
  });
});
