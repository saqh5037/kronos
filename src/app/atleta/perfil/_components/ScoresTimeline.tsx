"use client";

import { LineChart } from "@/components/charts/LineChart";
import type { MyScoreTimelinePoint } from "@/server/actions/athlete-home";

const fmtDay = (k: string) => {
  const [, m, d] = k.split("-");
  return `${d}/${m}`;
};

export function ScoresTimeline({ data }: { data: MyScoreTimelinePoint[] }) {
  // Normalize to 0..1 for visual consistency across mixed score types
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;
  const series = data.map((d) => ({
    date: d.date,
    score: ((d.value - min) / range) * 100,
  }));

  return (
    <LineChart
      data={series}
      xKey="date"
      lines={[{ key: "score", label: "Progreso (relativo)", color: "#19f08b" }]}
      height={180}
      yFormatter={(v) => `${v.toFixed(0)}`}
      xFormatter={fmtDay}
    />
  );
}
