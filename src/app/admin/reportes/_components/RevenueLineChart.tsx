"use client";

import { KronosLineChart } from "@/components/charts/kronos-chart";
import { formatMXN } from "@/lib/format";
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

/** Same money format as every other screen: "$400,000", not "$400.0k". */
const fmtCurrency = (v: number) => formatMXN(v, { suffix: false });

export function RevenueLineChart({ data }: { data: RevenueByMonthPoint[] }) {
  return (
    <KronosLineChart
      data={data}
      xKey="month"
      yKey="revenue"
      variant="cinematic"
      height={260}
      gradient
      /*
       * Money floors at zero, stated at the call site rather than left to the
       * default: the audit's "Crecimiento" finding was a 40-to-52 truncated axis
       * that made a 30 % rise look like a tenfold one. `zeroFloor` routes
       * through `computeYDomain` in `src/components/charts/domain.ts`.
       */
      zeroFloor
      formatY={fmtCurrency}
      formatX={fmtMonth}
      ariaLabel="Ingresos por mes"
    />
  );
}
