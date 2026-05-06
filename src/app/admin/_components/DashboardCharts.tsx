"use client";

import { KronosAreaChart } from "@/components/charts/kronos-chart";
import type { RevenueByDayPoint } from "@/server/actions/payments";
import type { AttendanceByDayPoint } from "@/server/actions/attendance";

const fmtDay = (k: unknown) => {
  if (typeof k !== "string") return String(k ?? "");
  const [, m, d] = k.split("-");
  return `${d}/${m}`;
};
const fmtCurrency = (v: number) => `$${(v / 1000).toFixed(1)}k`;

export function RevenueArea({ data }: { data: RevenueByDayPoint[] }) {
  return (
    <KronosAreaChart
      data={data}
      xKey="day"
      yKey="revenue"
      variant="cinematic"
      height={200}
      formatY={fmtCurrency}
      formatX={fmtDay}
      ariaLabel="Ingresos por día"
    />
  );
}

export function AttendanceArea({ data }: { data: AttendanceByDayPoint[] }) {
  return (
    <KronosAreaChart
      data={data}
      xKey="day"
      yKey="attended"
      variant="cinematic"
      height={200}
      formatY={(v) => v.toFixed(0)}
      formatX={fmtDay}
      ariaLabel="Asistencias por día"
    />
  );
}
