"use client";

import { useMemo } from "react";
import {
  eachDayOfInterval,
  startOfWeek,
  format,
  differenceInCalendarDays,
} from "date-fns";
import { CHART_COLORS } from "./tokens";

export type HeatmapDatum = { date: Date; value: number };

type Props = {
  data: HeatmapDatum[];
  from: Date;
  to: Date;
  cellSize?: number;
  cellGap?: number;
  /** Color used at the maximum intensity. Defaults to strain blue. */
  intensityColor?: string;
  emptyColor?: string;
  ariaLabel?: string;
};

/**
 * GitHub-style contributions heatmap. Weeks are columns (Mon→Sun rows).
 * Pure SVG, no Recharts dependency.
 */
export function Heatmap({
  data,
  from,
  to,
  cellSize = 12,
  cellGap = 3,
  intensityColor = CHART_COLORS.steel,
  emptyColor = CHART_COLORS.grid,
  ariaLabel = "Heatmap de actividad",
}: Props) {
  const { weeks, max } = useMemo(() => {
    const valueByKey = new Map<string, number>();
    for (const d of data) {
      const k = format(d.date, "yyyy-MM-dd");
      valueByKey.set(k, (valueByKey.get(k) ?? 0) + d.value);
    }

    const days = eachDayOfInterval({
      start: startOfWeek(from, { weekStartsOn: 1 }),
      end: to,
    });

    const weeks: { date: Date; value: number; inRange: boolean }[][] = [];
    let currentWeek: (typeof weeks)[number] = [];
    let max = 0;

    for (const day of days) {
      const k = format(day, "yyyy-MM-dd");
      const value = valueByKey.get(k) ?? 0;
      const inRange =
        differenceInCalendarDays(day, from) >= 0 &&
        differenceInCalendarDays(to, day) >= 0;
      currentWeek.push({ date: day, value, inRange });
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      if (value > max) max = value;
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return { weeks, max };
  }, [data, from, to]);

  const width = weeks.length * (cellSize + cellGap);
  const height = 7 * (cellSize + cellGap);

  function colorFor(value: number, inRange: boolean): string {
    if (!inRange) return "transparent";
    if (max === 0 || value === 0) return emptyColor;
    const intensity = Math.min(1, value / max);
    const minOpacity = 0.18;
    const opacity = minOpacity + intensity * (1 - minOpacity);
    return hexWithAlpha(intensityColor, opacity);
  }

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="xMinYMid meet"
    >
      {weeks.map((week, wi) =>
        week.map((cell, di) => {
          const titleStr = `${format(cell.date, "yyyy-MM-dd")}: ${cell.value}`;
          return (
            <rect
              key={`${wi}-${di}`}
              x={wi * (cellSize + cellGap)}
              y={di * (cellSize + cellGap)}
              width={cellSize}
              height={cellSize}
              rx={2}
              ry={2}
              fill={colorFor(cell.value, cell.inRange)}
            >
              <title>{titleStr}</title>
            </rect>
          );
        }),
      )}
    </svg>
  );
}

function hexWithAlpha(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}
