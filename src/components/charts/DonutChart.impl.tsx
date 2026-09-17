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
  /**
   * Show the legend with the value next to each label. Default true: a donut of
   * same-hue slices is unreadable without one (audit 2026-09-15).
   */
  showLegend?: boolean;
};

export function DonutChart({
  data,
  height = 220,
  innerRadius = 56,
  outerRadius = 84,
  formatter,
  showLegend = true,
}: Props) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colorFor = (d: DonutDatum, i: number) =>
    d.color ?? CHART_PALETTE[i % CHART_PALETTE.length];

  return (
    <div className="flex flex-col gap-3">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            stroke="var(--k-surface)"
            strokeWidth={2}
            paddingAngle={2}
          >
            {data.map((d, i) => (
              <Cell key={d.name} fill={colorFor(d, i)} />
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

      {showLegend && data.length > 0 ? (
        <ul className="flex list-none flex-col gap-1.5">
          {data.map((d, i) => (
            <li
              key={d.name}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: colorFor(d, i) }}
                />
                <span className="truncate text-[var(--k-t2)]">{d.name}</span>
              </span>
              <span className="shrink-0 font-mono font-semibold text-[var(--k-t1)]">
                {formatter ? formatter(d.value, d.name) : d.value}
                {total > 0 ? (
                  <span className="ml-1.5 font-normal text-[var(--k-t2)]">
                    {Math.round((d.value / total) * 100)}%
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
