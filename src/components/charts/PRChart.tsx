"use client";

import { KronosLineChart } from "./kronos-chart";
import { CHART_COLORS } from "./tokens";

export type PRChartPoint = {
  date: string;
  value: number;
  delta: number;
  isCurrentBest: boolean;
};

type Props = {
  data: PRChartPoint[];
  unit: string | null;
  currentBest: number | null;
  height?: number;
};

function formatDate(iso: unknown) {
  if (typeof iso !== "string") return String(iso ?? "");
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
}

export function PRChart({ data, unit, currentBest, height = 240 }: Props) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs"
        style={{ height, color: "var(--text-3)" }}
      >
        Sin datos de progresión
      </div>
    );
  }

  return (
    <KronosLineChart
      data={data}
      xKey="date"
      yKey="value"
      variant="cinematic"
      height={height}
      gradient
      formatY={(v) => `${v}`}
      formatX={formatDate}
      referenceLines={
        currentBest !== null
          ? [
              {
                y: currentBest,
                color: CHART_COLORS.cinematicBright,
                label: "PR ACTUAL",
              },
            ]
          : undefined
      }
      tooltipContent={(point) => {
        const p = point as PRChartPoint;
        return (
          <div>
            <div
              className="font-mono text-[10px] uppercase tracking-wider"
              style={{ color: "var(--text-3)" }}
            >
              {formatDate(p.date)}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="font-display text-sm font-bold"
                style={{ color: CHART_COLORS.cinematicBright }}
              >
                {p.value} {unit}
              </span>
              {p.delta > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "var(--moss-soft)",
                    color: "var(--moss)",
                  }}
                >
                  +{p.delta.toFixed(1)}%
                </span>
              )}
            </div>
            {p.isCurrentBest && (
              <div
                className="mt-1 text-[10px] font-bold tracking-wide"
                style={{ color: "var(--ember)" }}
              >
                ★ PR ACTUAL
              </div>
            )}
          </div>
        );
      }}
      ariaLabel="Histórico de PR"
    />
  );
}
