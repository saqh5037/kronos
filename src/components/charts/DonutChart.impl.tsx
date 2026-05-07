"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_PALETTE } from "./tokens";

export type DonutDatum = {
  name: string;
  value: number;
  color?: string;
};

type Props = {
  data: DonutDatum[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  formatter?: (value: number, name: string) => string;
};

export function DonutChart({
  data,
  height = 220,
  innerRadius = 56,
  outerRadius = 84,
  formatter,
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          stroke="var(--card)"
          strokeWidth={2}
          paddingAngle={2}
        >
          {data.map((d, i) => (
            <Cell
              key={d.name}
              fill={d.color ?? CHART_PALETTE[i % CHART_PALETTE.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--k-elevated)",
            border: "1px solid var(--k-line-2)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={
            formatter
              ? (((v: unknown, n: unknown) =>
                  formatter(Number(v), String(n))) as never)
              : undefined
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
