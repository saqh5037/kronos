import { formatPriceMxn } from "./saas-billing";

export type InvoiceCsvRow = {
  id: string;
  paidAt: Date;
  planName: string;
  amountMxnCents: number;
  periodStart: Date;
  periodEnd: Date;
  status: "PAID" | "REFUNDED";
};

export type InvoiceSummary = {
  totalCents: number;
  count: number;
  refundedCount: number;
  byPlan: Record<string, { count: number; cents: number }>;
};

type SummarizableRow = {
  amountMxnCents: number;
  status: "PAID" | "REFUNDED";
  planName?: string;
  planSlug?: string;
};

export function summarizeInvoices(rows: SummarizableRow[]): InvoiceSummary {
  const summary: InvoiceSummary = {
    totalCents: 0,
    count: 0,
    refundedCount: 0,
    byPlan: {},
  };

  for (const row of rows) {
    if (row.status === "REFUNDED") {
      summary.refundedCount += 1;
      continue;
    }
    summary.count += 1;
    summary.totalCents += row.amountMxnCents;

    const key = row.planSlug ?? row.planName ?? "unknown";
    if (!summary.byPlan[key]) {
      summary.byPlan[key] = { count: 0, cents: 0 };
    }
    summary.byPlan[key].count += 1;
    summary.byPlan[key].cents += row.amountMxnCents;
  }

  return summary;
}

const HEADERS = [
  "ID",
  "Fecha de pago",
  "Plan",
  "Monto",
  "Período inicio",
  "Período fin",
  "Estado",
];

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDateMxn(d: Date): string {
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function invoicesToCsv(rows: InvoiceCsvRow[]): string {
  const lines: string[] = [HEADERS.map(escapeCsvField).join(",")];
  for (const row of rows) {
    const cells = [
      row.id,
      formatDateMxn(row.paidAt),
      row.planName,
      formatPriceMxn(row.amountMxnCents),
      formatDateMxn(row.periodStart),
      formatDateMxn(row.periodEnd),
      row.status === "PAID" ? "Pagado" : "Reembolsado",
    ];
    lines.push(cells.map(escapeCsvField).join(","));
  }
  // BOM para que Excel detecte UTF-8
  return "﻿" + lines.join("\r\n") + "\r\n";
}
