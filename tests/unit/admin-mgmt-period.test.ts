/**
 * Pagos period arithmetic (audit 2026-09-15, P0 #6 / systemic S4).
 *
 * The screen showed "Pagos rango 27" next to "33 pagos en el rango" under one
 * filter because the KPI counted PAID-by-paidAt while the table counted
 * everything-by-createdAt. These helpers make one row set produce every number
 * on the page, so the breakdown always adds up to the table count.
 */
import { describe, it, expect } from "vitest";
import type { PaymentRow } from "@/server/actions/payments";
import type { OverdueMembership } from "@/server/actions/payments";
import {
  dailyRevenueSeries,
  dedupeOverdueMemberships,
  planCardLines,
  summarizePaymentPeriod,
} from "@/app/admin/pagos/_lib/period";

function row(over: Partial<PaymentRow> & { id: string }): PaymentRow {
  return {
    amount: 0,
    currency: "MXN",
    gateway: "CASH",
    status: "PAID",
    paidAt: null,
    createdAt: new Date("2026-09-10T12:00:00.000Z"),
    membershipId: "m1",
    athleteName: "Mía Moreno",
    planName: "Mensual Ilimitado",
    ...over,
  } as PaymentRow;
}

describe("summarizePaymentPeriod", () => {
  const rows = [
    row({ id: "1", status: "PAID", amount: 2500 }),
    row({ id: "2", status: "PAID", amount: 1500 }),
    row({ id: "3", status: "PENDING", amount: 2500 }),
    row({ id: "4", status: "FAILED", amount: 900 }),
    row({ id: "5", status: "REFUNDED", amount: 500 }),
  ];

  it("breaks the period down by status", () => {
    const s = summarizePaymentPeriod(rows);
    expect(s.paid).toEqual({ count: 2, amount: 4000 });
    expect(s.pending).toEqual({ count: 1, amount: 2500 });
    expect(s.failed).toEqual({ count: 1, amount: 900 });
    expect(s.refunded).toEqual({ count: 1, amount: 500 });
  });

  it("the breakdown always adds up to the movement count — KPI cannot disagree with the table", () => {
    const s = summarizePaymentPeriod(rows);
    expect(
      s.paid.count + s.pending.count + s.failed.count + s.refunded.count,
    ).toBe(s.total);
    expect(s.total).toBe(rows.length);
  });

  it("is all zeros for an empty period", () => {
    const s = summarizePaymentPeriod([]);
    expect(s.total).toBe(0);
    expect(s.paid).toEqual({ count: 0, amount: 0 });
    expect(s.failed).toEqual({ count: 0, amount: 0 });
  });
});

describe("dailyRevenueSeries", () => {
  const days = ["2026-09-13", "2026-09-14", "2026-09-15"];

  it("only counts collected money, keyed by the day it was paid", () => {
    const series = dailyRevenueSeries(
      [
        row({
          id: "1",
          status: "PAID",
          amount: 2500,
          paidAt: new Date("2026-09-14T15:00:00.000Z"),
        }),
        row({
          id: "2",
          status: "PENDING",
          amount: 9999,
          paidAt: new Date("2026-09-14T15:00:00.000Z"),
        }),
      ],
      days,
    );
    expect(series).toEqual([
      { day: "2026-09-13", revenue: 0, count: 0 },
      { day: "2026-09-14", revenue: 2500, count: 1 },
      { day: "2026-09-15", revenue: 0, count: 0 },
    ]);
  });

  it("never returns a negative point, so the axis has no reason to go below zero", () => {
    const series = dailyRevenueSeries(
      [row({ id: "1", status: "FAILED", amount: 500 })],
      days,
    );
    expect(series.every((p) => p.revenue >= 0)).toBe(true);
  });

  it("falls back to createdAt when a paid row has no paidAt", () => {
    const series = dailyRevenueSeries(
      [
        row({
          id: "1",
          status: "PAID",
          amount: 700,
          paidAt: null,
          createdAt: new Date("2026-09-15T10:00:00.000Z"),
        }),
      ],
      days,
    );
    expect(series[2]).toEqual({ day: "2026-09-15", revenue: 700, count: 1 });
  });

  it("drops money paid outside the rendered days instead of stacking it on day one", () => {
    const series = dailyRevenueSeries(
      [
        row({
          id: "1",
          status: "PAID",
          amount: 700,
          paidAt: new Date("2026-08-01T10:00:00.000Z"),
        }),
      ],
      days,
    );
    expect(series.reduce((s, p) => s + p.revenue, 0)).toBe(0);
  });

  it("sums to the same total as the PAID bucket of the summary", () => {
    const rows = [
      row({
        id: "1",
        status: "PAID",
        amount: 2500,
        paidAt: new Date("2026-09-13T10:00:00.000Z"),
      }),
      row({
        id: "2",
        status: "PAID",
        amount: 1500,
        paidAt: new Date("2026-09-15T10:00:00.000Z"),
      }),
    ];
    const seriesTotal = dailyRevenueSeries(rows, days).reduce(
      (s, p) => s + p.revenue,
      0,
    );
    expect(seriesTotal).toBe(summarizePaymentPeriod(rows).paid.amount);
  });
});

describe("dedupeOverdueMemberships", () => {
  const base = (over: Partial<OverdueMembership>): OverdueMembership => ({
    membershipId: "m1",
    athleteId: "a1",
    athleteName: "Joaquín Ortiz",
    planName: "Drop-in",
    endDate: new Date("2026-08-12T00:00:00.000Z"),
    daysOverdue: 34,
    pendingAmount: 250,
    currency: "MXN",
    ...over,
  });

  it("collapses the same athlete + plan into one row", () => {
    const rows = dedupeOverdueMemberships([
      base({
        membershipId: "m1",
        endDate: new Date("2026-08-12"),
        daysOverdue: 34,
      }),
      base({
        membershipId: "m2",
        endDate: new Date("2026-09-01"),
        daysOverdue: 14,
      }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].occurrences).toBe(2);
  });

  it("keeps the oldest debt and the total owed", () => {
    const rows = dedupeOverdueMemberships([
      base({
        membershipId: "m1",
        endDate: new Date("2026-08-12"),
        daysOverdue: 34,
      }),
      base({
        membershipId: "m2",
        endDate: new Date("2026-09-01"),
        daysOverdue: 14,
      }),
    ]);
    expect(rows[0].daysOverdue).toBe(34);
    expect(rows[0].pendingAmount).toBe(500);
    expect(rows[0].endDate.getTime()).toBe(new Date("2026-08-12").getTime());
  });

  it("keeps different plans apart", () => {
    const rows = dedupeOverdueMemberships([
      base({ membershipId: "m1", planName: "Drop-in" }),
      base({ membershipId: "m2", planName: "Mensual Ilimitado" }),
    ]);
    expect(rows).toHaveLength(2);
  });

  it("keeps different athletes apart and sorts by days overdue", () => {
    const rows = dedupeOverdueMemberships([
      base({ membershipId: "m1", athleteId: "a1", daysOverdue: 5 }),
      base({
        membershipId: "m2",
        athleteId: "a2",
        athleteName: "Ana Ruiz",
        daysOverdue: 40,
      }),
    ]);
    expect(rows.map((r) => r.athleteName)).toEqual([
      "Ana Ruiz",
      "Joaquín Ortiz",
    ]);
  });

  it("returns an empty list untouched", () => {
    expect(dedupeOverdueMemberships([])).toEqual([]);
  });
});

describe("planCardLines", () => {
  it("says '1 clase/mes', not '1 clases/mes'", () => {
    expect(
      planCardLines({
        classesPerMonth: 1,
        durationDays: null,
        activeMembershipCount: 0,
      }),
    ).toContain("1 clase/mes");
  });

  it("pluralises classes above one", () => {
    expect(
      planCardLines({
        classesPerMonth: 12,
        durationDays: null,
        activeMembershipCount: 0,
      }),
    ).toContain("12 clases/mes");
  });

  it("says '1 día', not '1 días'", () => {
    expect(
      planCardLines({
        classesPerMonth: null,
        durationDays: 1,
        activeMembershipCount: 0,
      }),
    ).toContain("1 día");
  });

  it("pluralises days above one", () => {
    expect(
      planCardLines({
        classesPerMonth: null,
        durationDays: 30,
        activeMembershipCount: 0,
      }),
    ).toContain("30 días");
  });

  it("uses Spanish 'membresía' and never the English 'memberships'", () => {
    const one = planCardLines({
      classesPerMonth: null,
      durationDays: null,
      activeMembershipCount: 1,
    });
    const many = planCardLines({
      classesPerMonth: null,
      durationDays: null,
      activeMembershipCount: 4,
    });
    expect(one).toContain("1 membresía activa");
    expect(many).toContain("4 membresías activas");
    expect(one.join(" ")).not.toMatch(/membership/i);
  });

  it("says 'Sin membresías activas' at zero instead of '0 memberships activas'", () => {
    expect(
      planCardLines({
        classesPerMonth: null,
        durationDays: null,
        activeMembershipCount: 0,
      }),
    ).toContain("Sin membresías activas");
  });
});
