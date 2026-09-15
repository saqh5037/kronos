"use client";

import { Icon } from "@/components/kronos/Icon";
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
        style={{ height, color: "var(--k-t2)" }}
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
      /* A 1RM is neither a count nor money: zero-flooring the axis would flatten
         a season of progression into one line (audit 2026-09-15). */
      zeroFloor={false}
      formatY={(v) => `${v}`}
      formatX={formatDate}
      referenceLines={
        currentBest !== null
          ? [
              {
                y: currentBest,
                color: CHART_COLORS.primary,
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
              style={{ color: "var(--k-t2)" }}
            >
              {formatDate(p.date)}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="font-display text-sm font-bold"
                style={{ color: CHART_COLORS.primary }}
              >
                {p.value} {unit}
              </span>
              {p.delta > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "var(--k-accent-soft)",
                    color: "var(--k-accent)",
                  }}
                >
                  +{p.delta.toFixed(1)}%
                </span>
              )}
            </div>
            {p.isCurrentBest && (
              <div
                className="mt-1 flex items-center gap-1 text-[10px] font-bold tracking-wide"
                style={{ color: "var(--k-accent)" }}
              >
                <Icon name="trophy" size={16} />
                PR ACTUAL
              </div>
            )}
          </div>
        );
      }}
      ariaLabel="Histórico de PR"
    />
  );
}
