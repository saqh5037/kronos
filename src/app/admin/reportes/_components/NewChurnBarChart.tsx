"use client";

import { BarChart } from "@/components/charts/BarChart";
import { CHART_COLORS } from "@/components/charts/tokens";
import type { AthletesByMonthPoint } from "@/server/actions/reports";

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

export function NewChurnBarChart({ data }: { data: AthletesByMonthPoint[] }) {
  return (
    <BarChart
      data={data}
      xKey="month"
      bars={[
        { key: "newAthletes", label: "Nuevos", color: CHART_COLORS.moss },
        {
          key: "churnedMemberships",
          label: "Bajas",
          color: CHART_COLORS.ember,
        },
      ]}
      stacked={false}
      showLegend
      height={240}
      yFormatter={(v) => v.toFixed(0)}
      xFormatter={fmtMonth}
    />
  );
}
