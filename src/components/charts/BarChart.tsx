"use client";

import dynamic from "next/dynamic";
import type { ReactElement } from "react";

export type { BarSeries } from "./BarChart.impl";

type BarChartDynamicProps<T extends Record<string, unknown>> = {
  data: T[];
  xKey: keyof T & string;
  bars: import("./BarChart.impl").BarSeries[];
  height?: number;
  yFormatter?: (value: number) => string;
  xFormatter?: (value: string) => string;
  stacked?: boolean;
  showLegend?: boolean;
};

const BarChartDynamic = dynamic(
  () => import("./BarChart.impl").then((m) => m.BarChart),
  {
    ssr: false,
    loading: () => (
      <div
        className="k-skeleton rounded-xl"
        style={{ height: 240, width: "100%" }}
      />
    ),
  },
) as unknown as <T extends Record<string, unknown>>(
  props: BarChartDynamicProps<T>,
) => ReactElement;

export const BarChart = BarChartDynamic;
