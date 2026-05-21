"use client";

import dynamic from "next/dynamic";
import type { ReactElement } from "react";
import type { KronosLineChartProps } from "./KronosLineChart";

function ChartSkeleton({ height }: { height?: number }) {
  return (
    <div
      className="k-skeleton rounded-xl"
      style={{ height: height ?? 240, width: "100%" }}
      aria-hidden="true"
    />
  );
}

export const KronosLineChart = dynamic(
  () => import("./KronosLineChart").then((m) => m.KronosLineChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
) as unknown as <T>(props: KronosLineChartProps<T>) => ReactElement;

export const KronosAreaChart = dynamic(
  () => import("./KronosLineChart").then((m) => m.KronosAreaChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
) as unknown as <T>(props: KronosLineChartProps<T>) => ReactElement;
