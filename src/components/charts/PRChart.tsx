"use client";

import {
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
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

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ payload: PRChartPoint }>;
  label?: string;
  unit: string | null;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{
        background: "var(--card-elevated)",
        border: "1px solid var(--line-strong)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div className="font-semibold" style={{ color: "var(--text)" }}>
        {formatDate(label ?? "")}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span
          className="font-display text-sm font-bold"
          style={{ color: "var(--fire)" }}
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
}

export function PRChart({ data, unit, currentBest, height = 220 }: Props) {
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
    <ResponsiveContainer width="100%" height={height}>
      <RLineChart
        data={data}
        margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          stroke={CHART_COLORS.grid}
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          stroke={CHART_COLORS.text3}
          tick={{ fontSize: 10 }}
          tickFormatter={formatDate}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          stroke={CHART_COLORS.text3}
          tick={{ fontSize: 10 }}
          tickFormatter={(v: number) => `${v}`}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          content={<CustomTooltip unit={unit} />}
          cursor={{ stroke: CHART_COLORS.grid, strokeWidth: 1 }}
        />
        {currentBest !== null && (
          <ReferenceLine
            y={currentBest}
            stroke={CHART_COLORS.moss}
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke={CHART_COLORS.fire}
          strokeWidth={2.5}
          dot={(props: Record<string, unknown>) => {
            const cx = Number(props.cx ?? 0);
            const cy = Number(props.cy ?? 0);
            const p = props.payload as PRChartPoint;
            const r = p?.isCurrentBest ? 5 : 3;
            const fill = p?.isCurrentBest
              ? CHART_COLORS.moss
              : CHART_COLORS.fire;
            const stroke = p?.isCurrentBest ? CHART_COLORS.moss : "transparent";
            return (
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={fill}
                stroke={stroke}
                strokeWidth={p?.isCurrentBest ? 3 : 0}
              />
            );
          }}
          activeDot={{
            r: 6,
            fill: CHART_COLORS.fire,
            stroke: "#fff",
            strokeWidth: 2,
          }}
        />
      </RLineChart>
    </ResponsiveContainer>
  );
}
