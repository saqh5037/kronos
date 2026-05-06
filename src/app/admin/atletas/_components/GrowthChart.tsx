"use client";

import { KronosAreaChart } from "@/components/charts/kronos-chart";
import type { AthleteGrowthPoint } from "@/server/actions/athletes";

const fmtDay = (k: unknown) => {
  if (typeof k !== "string") return String(k ?? "");
  const [, m, d] = k.split("-");
  return `${d}/${m}`;
};

export function GrowthChart({ data }: { data: AthleteGrowthPoint[] }) {
  return (
    <KronosAreaChart
      data={data}
      xKey="day"
      yKey="total"
      variant="cinematic"
      height={240}
      formatY={(v) => v.toFixed(0)}
      formatX={fmtDay}
      ariaLabel="Crecimiento de atletas"
    />
  );
}
