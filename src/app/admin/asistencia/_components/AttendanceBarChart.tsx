"use client";

import { BarChart } from "@/components/charts/BarChart";
import { CHART_COLORS } from "@/components/charts/tokens";
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
        { key: "attended", label: "Asistidos", color: CHART_COLORS.moss },
        { key: "noShow", label: "No-show", color: CHART_COLORS.ember },
        { key: "booked", label: "Reservados", color: CHART_COLORS.steel },
      ]}
      stacked
      showLegend
      height={240}
      yFormatter={(v) => v.toFixed(0)}
      xFormatter={fmtDay}
    />
  );
}
