"use client";

import { AreaChart } from "@/components/charts/AreaChart";
import type { AthleteGrowthPoint } from "@/server/actions/athletes";

const fmtDay = (k: string) => {
  const [, m, d] = k.split("-");
  return `${d}/${m}`;
};

export function GrowthChart({ data }: { data: AthleteGrowthPoint[] }) {
  return (
    <AreaChart
      data={data}
      xKey="day"
      series={[{ key: "total", label: "Total atletas", color: "#3aa3ff" }]}
      height={220}
      yFormatter={(v) => v.toFixed(0)}
      xFormatter={fmtDay}
    />
  );
}
