"use client";

import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CHART_COLORS, CHART_PALETTE } from "./tokens";
import type { LineSeries } from "./LineChart";

type Props<T extends Record<string, unknown>> = {
  data: T[];
  xKey: keyof T & string;
  bars: LineSeries[];
  height?: number;
  yFormatter?: (value: number) => string;
  xFormatter?: (value: string) => string;
  stacked?: boolean;
  showLegend?: boolean;
};

export function BarChart<T extends Record<string, unknown>>({
  data,
  xKey,
  bars,
  height = 240,
  yFormatter,
  xFormatter,
  stacked = false,
  showLegend = false,
}: Props<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid
          stroke={CHART_COLORS.grid}
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey={xKey as string}
          stroke={CHART_COLORS.text3}
          tick={{ fontSize: 11 }}
          tickFormatter={xFormatter}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={CHART_COLORS.text3}
          tick={{ fontSize: 11 }}
          tickFormatter={yFormatter}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          cursor={{ fill: "var(--hover-subtle)" }}
          contentStyle={{
            background: "var(--card-elevated)",
            border: "1px solid var(--line-strong)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--text-2)" }}
          formatter={
            yFormatter
              ? (((v: unknown) => yFormatter(Number(v))) as never)
              : undefined
          }
        />
        {showLegend ? (
          <Legend wrapperStyle={{ fontSize: 12, color: CHART_COLORS.text2 }} />
        ) : null}
        {bars.map((b, i) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.label ?? b.key}
            fill={b.color ?? CHART_PALETTE[i % CHART_PALETTE.length]}
            stackId={stacked ? "1" : undefined}
            radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
          />
        ))}
      </RBarChart>
    </ResponsiveContainer>
  );
}
