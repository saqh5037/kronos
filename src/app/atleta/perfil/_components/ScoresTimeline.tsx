"use client";

import { KronosLineChart } from "@/components/charts/kronos-chart";
import type { MyScoreTimelinePoint } from "@/server/actions/athlete-home";

const fmtDay = (k: unknown) => {
  if (typeof k !== "string") return String(k ?? "");
  const [, m, d] = k.split("-");
  return `${d}/${m}`;
};

export function ScoresTimeline({ data }: { data: MyScoreTimelinePoint[] }) {
  // Normalize to 0..100 for visual consistency across mixed score types
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;
  const series = data.map((d) => ({
    date: d.date,
    score: ((d.value - min) / range) * 100,
  }));

  return (
    <KronosLineChart
      data={series}
      xKey="date"
      yKey="score"
      variant="cinematic"
      height={200}
      gradient
      formatY={(v) => `${v.toFixed(0)}`}
      formatX={fmtDay}
      ariaLabel="Progreso de scores en el tiempo"
    />
  );
}
