"use client";

import { LineChart } from "@/components/charts/LineChart";
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

const fmtMonth = (k: string) => {
  const [, m] = k.split("-");
  const idx = parseInt(m, 10) - 1;
  return MONTHS_ES[idx] ?? k;
};

const fmtCurrency = (v: number) => `$${(v / 1000).toFixed(1)}k`;

export function RevenueLineChart({ data }: { data: RevenueByMonthPoint[] }) {
  return (
    <LineChart
      data={data}
      xKey="month"
      lines={[{ key: "revenue", label: "Revenue", color: "#19f08b" }]}
      height={240}
      yFormatter={fmtCurrency}
      xFormatter={fmtMonth}
    />
  );
}
