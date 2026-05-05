"use client";

import { BarChart } from "@/components/charts/BarChart";
import type { AttendanceByDayPoint } from "@/server/actions/attendance";

const fmtDay = (k: string) => {
  const [, m, d] = k.split("-");
  return `${d}/${m}`;
};

export function AttendanceBarChart({ data }: { data: AttendanceByDayPoint[] }) {
  return (
    <BarChart
      data={data}
      xKey="day"
      bars={[
        { key: "attended", label: "Asistidos", color: "#4a7c59" },
        { key: "noShow", label: "No-show", color: "#c44536" },
        { key: "booked", label: "Reservados", color: "#64748b" },
      ]}
      stacked
      showLegend
      height={240}
      yFormatter={(v) => v.toFixed(0)}
      xFormatter={fmtDay}
    />
  );
}
