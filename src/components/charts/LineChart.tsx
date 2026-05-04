"use client";

import {
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CHART_COLORS, CHART_PALETTE } from "./tokens";

export type LineSeries = {
  key: string;
  label?: string;
  color?: string;
};

type Props<T extends Record<string, unknown>> = {
  data: T[];
  xKey: keyof T & string;
  lines: LineSeries[];
  height?: number;
  yFormatter?: (value: number) => string;
  xFormatter?: (value: string) => string;
  showLegend?: boolean;
};

export function LineChart<T extends Record<string, unknown>>({
  data,
  xKey,
  lines,
  height = 240,
  yFormatter,
  xFormatter,
  showLegend = false,
}: Props<T>) {
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
        {lines.map((line, i) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.label ?? line.key}
            stroke={line.color ?? CHART_PALETTE[i % CHART_PALETTE.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </RLineChart>
    </ResponsiveContainer>
  );
}
