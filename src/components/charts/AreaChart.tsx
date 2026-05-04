"use client";

import {
  AreaChart as RAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, CHART_PALETTE } from "./tokens";
import type { LineSeries } from "./LineChart";

type Props<T extends Record<string, unknown>> = {
  data: T[];
  xKey: keyof T & string;
  series: LineSeries[];
  height?: number;
  yFormatter?: (value: number) => string;
  xFormatter?: (value: string) => string;
  stacked?: boolean;
};

export function AreaChart<T extends Record<string, unknown>>({
  data,
  xKey,
  series,
  height = 240,
  yFormatter,
  xFormatter,
  stacked = false,
}: Props<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RAreaChart
        data={data}
        margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
      >
        <defs>
          {series.map((s, i) => {
            const color = s.color ?? CHART_PALETTE[i % CHART_PALETTE.length];
            return (
              <linearGradient
                key={s.key}
                id={`grad-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            );
          })}
        </defs>
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
        {series.map((s, i) => {
          const color = s.color ?? CHART_PALETTE[i % CHART_PALETTE.length];
          return (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label ?? s.key}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              stackId={stacked ? "1" : undefined}
            />
          );
        })}
      </RAreaChart>
    </ResponsiveContainer>
  );
}
