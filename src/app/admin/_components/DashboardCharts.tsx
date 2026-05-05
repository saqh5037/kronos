"use client";

import { AreaChart } from "@/components/charts/AreaChart";
import type { RevenueByDayPoint } from "@/server/actions/payments";
import type { AttendanceByDayPoint } from "@/server/actions/attendance";

const fmtDay = (k: string) => {
  const [, m, d] = k.split("-");
  return `${d}/${m}`;
};
const fmtCurrency = (v: number) => `$${(v / 1000).toFixed(1)}k`;

export function RevenueArea({ data }: { data: RevenueByDayPoint[] }) {
  return (
    <AreaChart
      data={data}
      xKey="day"
      series={[{ key: "revenue", label: "Ingresos", color: "#4a7c59" }]}
      height={180}
      yFormatter={fmtCurrency}
      xFormatter={fmtDay}
    />
  );
}

export function AttendanceArea({ data }: { data: AttendanceByDayPoint[] }) {
  return (
    <AreaChart
      data={data}
      xKey="day"
      series={[{ key: "attended", label: "Asistencias", color: "#64748b" }]}
      height={180}
      yFormatter={(v) => v.toFixed(0)}
      xFormatter={fmtDay}
    />
  );
}
