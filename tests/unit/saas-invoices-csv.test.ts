import { describe, it, expect } from "vitest";
import {
  invoicesToCsv,
  summarizeInvoices,
  type InvoiceCsvRow,
} from "@/lib/saas-invoices-csv";

const sampleRow: InvoiceCsvRow = {
  id: "inv-001",
  paidAt: new Date("2026-05-01T12:00:00Z"),
  planName: "Pro",
  amountMxnCents: 49900,
  periodStart: new Date("2026-05-01T00:00:00Z"),
  periodEnd: new Date("2026-06-01T00:00:00Z"),
  status: "PAID",
};

describe("invoicesToCsv", () => {
  it("incluye headers correctos", () => {
    const csv = invoicesToCsv([]);
    expect(csv).toContain(
      "ID,Fecha de pago,Plan,Monto,Período inicio,Período fin,Estado",
    );
  });

  it("incluye BOM al inicio (UTF-8 detection en Excel)", () => {
    const csv = invoicesToCsv([]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("usa CRLF como separador de líneas (compat Excel)", () => {
    const csv = invoicesToCsv([sampleRow]);
    expect(csv).toContain("\r\n");
  });

  it("formatea montos como '$X MXN'", () => {
    const csv = invoicesToCsv([sampleRow]);
    expect(csv).toContain("$499 MXN");
  });

  it("monto 0 se formatea como 'Gratis'", () => {
    const csv = invoicesToCsv([{ ...sampleRow, amountMxnCents: 0 }]);
    expect(csv).toContain("Gratis");
  });

  it("status PAID se traduce a 'Pagado'", () => {
    const csv = invoicesToCsv([sampleRow]);
    expect(csv).toContain("Pagado");
  });

  it("status REFUNDED se traduce a 'Reembolsado'", () => {
    const csv = invoicesToCsv([{ ...sampleRow, status: "REFUNDED" }]);
    expect(csv).toContain("Reembolsado");
  });

  it("escapa comillas dobles en el plan name", () => {
    const csv = invoicesToCsv([{ ...sampleRow, planName: 'Plan "Gold"' }]);
    expect(csv).toContain('"Plan ""Gold"""');
  });

  it("escapa comas en el plan name", () => {
    const csv = invoicesToCsv([{ ...sampleRow, planName: "Pro, Anual" }]);
    expect(csv).toContain('"Pro, Anual"');
  });

  it("escapa newlines en el plan name", () => {
    const csv = invoicesToCsv([{ ...sampleRow, planName: "Pro\nDescuento" }]);
    expect(csv).toContain('"Pro\nDescuento"');
  });

  it("formatea fechas en es-MX dd/MM/yyyy", () => {
    const csv = invoicesToCsv([sampleRow]);
    // Mayo 1 = 01/05/2026
    expect(csv).toMatch(/01\/05\/2026/);
  });

  it("orden de columnas: ID, Fecha, Plan, Monto, Periodo inicio, Periodo fin, Estado", () => {
    const csv = invoicesToCsv([sampleRow]);
    const lines = csv.split("\r\n");
    const dataLine = lines[1];
    expect(dataLine?.startsWith("inv-001,")).toBe(true);
  });

  it("array vacío genera CSV solo con headers", () => {
    const csv = invoicesToCsv([]);
    const lines = csv
      .split("\r\n")
      .filter((l) => l.replace(/^﻿/, "").length > 0);
    expect(lines.length).toBe(1);
    expect(lines[0]?.replace(/^﻿/, "")).toContain("ID");
  });
});

describe("summarizeInvoices", () => {
  it("array vacío → totalCents=0 count=0", () => {
    expect(summarizeInvoices([])).toEqual({
      totalCents: 0,
      count: 0,
      refundedCount: 0,
      byPlan: {},
    });
  });

  it("suma solo PAID, ignora REFUNDED", () => {
    const result = summarizeInvoices([
      { amountMxnCents: 49900, status: "PAID", planSlug: "pro" },
      { amountMxnCents: 49900, status: "PAID", planSlug: "pro" },
      { amountMxnCents: 49900, status: "REFUNDED", planSlug: "pro" },
    ]);
    expect(result.totalCents).toBe(99800);
    expect(result.count).toBe(2);
    expect(result.refundedCount).toBe(1);
  });

  it("agrupa byPlan correctamente", () => {
    const result = summarizeInvoices([
      { amountMxnCents: 49900, status: "PAID", planSlug: "pro" },
      { amountMxnCents: 99900, status: "PAID", planSlug: "premium" },
      { amountMxnCents: 49900, status: "PAID", planSlug: "pro" },
    ]);
    expect(result.byPlan.pro).toEqual({ count: 2, cents: 99800 });
    expect(result.byPlan.premium).toEqual({ count: 1, cents: 99900 });
    expect(result.totalCents).toBe(199700);
  });

  it("usa planName como fallback si no hay planSlug", () => {
    const result = summarizeInvoices([
      { amountMxnCents: 49900, status: "PAID", planName: "Pro" },
    ]);
    expect(result.byPlan.Pro).toEqual({ count: 1, cents: 49900 });
  });

  it("REFUNDED no agrega al byPlan", () => {
    const result = summarizeInvoices([
      { amountMxnCents: 49900, status: "REFUNDED", planSlug: "pro" },
    ]);
    expect(result.byPlan).toEqual({});
    expect(result.refundedCount).toBe(1);
  });
});
