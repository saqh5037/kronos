"use client";

import { AreaChart } from "@/components/charts/AreaChart";
import type { RevenueByDayPoint } from "@/server/actions/payments";

const fmtCurrency = (v: number) => `$${v.toLocaleString("es-MX")}`;
const fmtDayShort = (k: string) => {
  const [, m, d] = k.split("-");
  return `${d}/${m}`;
};

export function RevenueChart({ data }: { data: RevenueByDayPoint[] }) {
  return (
    <AreaChart
      data={data}
      xKey="day"
      series={[{ key: "revenue", label: "Ingresos", color: "#19f08b" }]}
      height={220}
      yFormatter={fmtCurrency}
      xFormatter={fmtDayShort}
    />
  );
}
