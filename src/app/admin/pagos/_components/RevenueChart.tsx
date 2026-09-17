"use client";

import { KronosAreaChart } from "@/components/charts/kronos-chart";
import { formatMXN } from "@/lib/format";
import type { RevenuePoint } from "../_lib/period";

const fmtCurrency = (v: number) => formatMXN(v, { suffix: false });
const fmtDayShort = (k: unknown) => {
  if (typeof k !== "string") return String(k ?? "");
  const [, m, d] = k.split("-");
  return `${d}/${m}`;
};

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <KronosAreaChart
      data={data}
      xKey="day"
      yKey="revenue"
      variant="cinematic"
      height={240}
      formatY={fmtCurrency}
      formatX={fmtDayShort}
      ariaLabel="Ingresos cobrados por día"
    />
  );
}
