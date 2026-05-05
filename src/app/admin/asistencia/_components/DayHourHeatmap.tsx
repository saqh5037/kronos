"use client";

import type { AttendanceHeatmapCell } from "@/server/actions/attendance";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const HOURS_FROM = 5;
const HOURS_TO = 22;

function hexAlpha(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}

export function DayHourHeatmap({ cells }: { cells: AttendanceHeatmapCell[] }) {
  const matrix = new Map<string, AttendanceHeatmapCell>();
  let maxUtil = 0;
  for (const c of cells) {
    matrix.set(`${c.weekday}-${c.hour}`, c);
    const util = c.capacity > 0 ? c.attended / c.capacity : 0;
    if (util > maxUtil) maxUtil = util;
  }

  const cellSize = 22;
  const gap = 2;
  const labelW = 36;
  const headerH = 18;
  const hours = Array.from(
    { length: HOURS_TO - HOURS_FROM + 1 },
    (_, i) => HOURS_FROM + i,
  );

  const width = labelW + hours.length * (cellSize + gap);
  const height = headerH + 7 * (cellSize + gap);

  return (
    <svg
      role="img"
      aria-label="Heatmap utilización día × hora"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="xMinYMid meet"
    >
      {/* Hour headers */}
      {hours.map((h, i) => (
        <text
          key={`h-${h}`}
          x={labelW + i * (cellSize + gap) + cellSize / 2}
          y={12}
          textAnchor="middle"
          fontSize={9}
          fill="rgba(127,127,127,0.7)"
          fontFamily="monospace"
        >
          {h}
        </text>
      ))}

      {/* Day labels + cells */}
      {DAYS.map((day, di) => {
        const wd = di === 6 ? 0 : di + 1; // matrix uses 0=Sun..6=Sat
        return (
          <g key={day}>
            <text
              x={labelW - 6}
              y={headerH + di * (cellSize + gap) + cellSize / 2 + 3}
              textAnchor="end"
              fontSize={10}
              fill="rgba(127,127,127,0.7)"
              fontFamily="monospace"
            >
              {day}
            </text>
            {hours.map((h, hi) => {
              const cell = matrix.get(`${wd}-${h}`);
              const util =
                cell && cell.capacity > 0 ? cell.attended / cell.capacity : 0;
              const fill =
                !cell || cell.capacity === 0
                  ? "rgba(127,127,127,0.06)"
                  : hexAlpha("#4a7c59", Math.min(1, 0.18 + util * 0.82));
              const titleStr = `${day} ${h}:00 — ${cell?.attended ?? 0}/${cell?.capacity ?? 0} (${Math.round(util * 100)}%)`;
              return (
                <rect
                  key={`${wd}-${h}`}
                  x={labelW + hi * (cellSize + gap)}
                  y={headerH + di * (cellSize + gap)}
                  width={cellSize}
                  height={cellSize}
                  rx={3}
                  ry={3}
                  fill={fill}
                >
                  <title>{titleStr}</title>
                </rect>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
