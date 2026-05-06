"use client";

import { KronosLineChart } from "@/components/charts/kronos-chart";
import type { RevenueByMonthPoint } from "@/server/actions/reports";

const MONTHS_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const fmtMonth = (k: unknown) => {
  if (typeof k !== "string") return String(k ?? "");
  const [, m] = k.split("-");
  const idx = parseInt(m, 10) - 1;
  return MONTHS_ES[idx] ?? k;
};

const fmtCurrency = (v: number) => `$${(v / 1000).toFixed(1)}k`;

export function RevenueLineChart({ data }: { data: RevenueByMonthPoint[] }) {
  return (
    <KronosLineChart
      data={data}
      xKey="month"
      yKey="revenue"
      variant="cinematic"
      height={260}
      gradient
      formatY={fmtCurrency}
      formatX={fmtMonth}
      ariaLabel="Ingresos por mes"
    />
  );
}
