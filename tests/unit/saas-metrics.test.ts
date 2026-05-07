import { describe, it, expect } from "vitest";
import {
  groupInvoicesByMonth,
  computeLifetimeSpent,
  computeArrProjectedCents,
  fillMonthlyHistory,
  type InvoiceForMetrics,
} from "@/server/saas-billing/metrics";

describe("groupInvoicesByMonth", () => {
  it("array vacío → []", () => {
    expect(groupInvoicesByMonth([])).toEqual([]);
  });

  it("agrupa invoices del mismo mes", () => {
    const rows: InvoiceForMetrics[] = [
      {
        paidAt: new Date("2026-05-03T12:00:00Z"),
        amountMxnCents: 49900,
        status: "PAID",
      },
      {
        paidAt: new Date("2026-05-20T12:00:00Z"),
        amountMxnCents: 49900,
        status: "PAID",
      },
    ];
    const out = groupInvoicesByMonth(rows);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({ month: "2026-05", cents: 99800, count: 2 });
  });

  it("orden ASC por mes (cross-year)", () => {
    const rows: InvoiceForMetrics[] = [
      {
        paidAt: new Date("2026-01-15T12:00:00Z"),
        amountMxnCents: 49900,
        status: "PAID",
      },
      {
        paidAt: new Date("2025-12-15T12:00:00Z"),
        amountMxnCents: 49900,
        status: "PAID",
      },
    ];
    const out = groupInvoicesByMonth(rows);
    expect(out.map((b) => b.month)).toEqual(["2025-12", "2026-01"]);
  });

  it("ignora REFUNDED del agrupamiento", () => {
    const rows: InvoiceForMetrics[] = [
      {
        paidAt: new Date("2026-05-03T12:00:00Z"),
        amountMxnCents: 49900,
        status: "PAID",
      },
      {
        paidAt: new Date("2026-05-20T12:00:00Z"),
        amountMxnCents: 49900,
        status: "REFUNDED",
      },
    ];
    const out = groupInvoicesByMonth(rows);
    expect(out[0]).toEqual({ month: "2026-05", cents: 49900, count: 1 });
  });
});

describe("computeLifetimeSpent", () => {
  it("array vacío → 0", () => {
    expect(computeLifetimeSpent([])).toBe(0);
  });

  it("suma todas las PAID, ignora REFUNDED", () => {
    const rows: InvoiceForMetrics[] = [
      { paidAt: new Date(), amountMxnCents: 49900, status: "PAID" },
      { paidAt: new Date(), amountMxnCents: 99900, status: "PAID" },
      { paidAt: new Date(), amountMxnCents: 49900, status: "REFUNDED" },
    ];
    expect(computeLifetimeSpent(rows)).toBe(149800);
  });
});

describe("computeArrProjectedCents", () => {
  it("0 MRR → 0 ARR", () => {
    expect(computeArrProjectedCents(0)).toBe(0);
  });

  it("$499 MRR → $5,988 ARR (49900 × 12)", () => {
    expect(computeArrProjectedCents(49900)).toBe(598800);
  });

  it("MRR negativo → 0 (sanitiza)", () => {
    expect(computeArrProjectedCents(-100)).toBe(0);
  });
});

describe("fillMonthlyHistory", () => {
  const NOW = new Date("2026-05-15T12:00:00Z");

  it("retorna N meses incluso sin data", () => {
    const out = fillMonthlyHistory([], 3, NOW);
    expect(out).toHaveLength(3);
    expect(out.map((b) => b.month)).toEqual(["2026-03", "2026-04", "2026-05"]);
    expect(out.every((b) => b.cents === 0)).toBe(true);
  });

  it("rellena meses ausentes con 0 entre buckets reales", () => {
    const buckets = [
      { month: "2026-03", cents: 49900, count: 1 },
      { month: "2026-05", cents: 49900, count: 1 },
    ];
    const out = fillMonthlyHistory(buckets, 3, NOW);
    expect(out[0]?.cents).toBe(49900);
    expect(out[1]?.cents).toBe(0);
    expect(out[2]?.cents).toBe(49900);
  });

  it("12 meses cross-year", () => {
    const out = fillMonthlyHistory([], 12, NOW);
    expect(out).toHaveLength(12);
    expect(out[0]?.month).toBe("2025-06");
    expect(out[11]?.month).toBe("2026-05");
  });
});
