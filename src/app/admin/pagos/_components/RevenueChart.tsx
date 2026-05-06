"use client";

import { KronosAreaChart } from "@/components/charts/kronos-chart";
import type { RevenueByDayPoint } from "@/server/actions/payments";

const fmtCurrency = (v: number) => `$${v.toLocaleString("es-MX")}`;
const fmtDayShort = (k: unknown) => {
  if (typeof k !== "string") return String(k ?? "");
  const [, m, d] = k.split("-");
  return `${d}/${m}`;
};

export function RevenueChart({ data }: { data: RevenueByDayPoint[] }) {
  return (
    <KronosAreaChart
      data={data}
      xKey="day"
      yKey="revenue"
      variant="cinematic"
      height={240}
      formatY={fmtCurrency}
      formatX={fmtDayShort}
      ariaLabel="Ingresos por día"
    />
  );
}
