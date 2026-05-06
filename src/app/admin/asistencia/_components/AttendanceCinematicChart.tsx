"use client";

import { KronosAreaChart } from "@/components/charts/kronos-chart";
import type { AttendanceByDayPoint } from "@/server/actions/attendance";

const fmtDay = (k: unknown) => {
  if (typeof k !== "string") return String(k ?? "");
  const parts = k.split("-");
  if (parts.length !== 3) return k;
  return `${parts[2]}/${parts[1]}`;
};

export function AttendanceCinematicChart({
  data,
}: {
  data: AttendanceByDayPoint[];
}) {
  return (
    <KronosAreaChart
      data={data}
      xKey="day"
      yKey="attended"
      variant="cinematic"
      height={240}
      formatY={(v) => v.toFixed(0)}
      formatX={fmtDay}
      ariaLabel="Asistencias por día"
    />
  );
}

export function NoShowCinematicChart({
  data,
}: {
  data: AttendanceByDayPoint[];
}) {
  return (
    <KronosAreaChart
      data={data}
      xKey="day"
      yKey="noShow"
      variant="cinematic"
      height={200}
      formatY={(v) => v.toFixed(0)}
      formatX={fmtDay}
      ariaLabel="No-shows por día"
    />
  );
}
