"use client";

import { BarChart } from "@/components/charts/BarChart";
import { CHART_COLORS } from "@/components/charts/tokens";
import type { StrainTrendPoint } from "@/server/actions/wearables";

function fmtDay(dayKey: string): string {
  const [, m, d] = dayKey.split("-");
  return `${d}/${m}`;
}

export function StrainChart({ data }: { data: StrainTrendPoint[] }) {
  const points = data.map((p) => ({ dayKey: p.dayKey, strain: p.strain ?? 0 }));
  return (
    <BarChart
      data={points}
      xKey="dayKey"
      bars={[{ key: "strain", color: CHART_COLORS.primary }]}
      height={180}
      yFormatter={(v) => v.toFixed(0)}
      xFormatter={fmtDay}
    />
  );
}
