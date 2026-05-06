"use client";

import dynamic from "next/dynamic";

export type { DonutDatum } from "./DonutChart.impl";

export const DonutChart = dynamic(
  () => import("./DonutChart.impl").then((m) => m.DonutChart),
  {
    ssr: false,
    loading: () => (
      <div
        className="k-skeleton rounded-xl"
        style={{ height: 220, width: "100%" }}
      />
    ),
  },
);
