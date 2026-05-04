"use client";

import { DonutChart } from "@/components/charts/DonutChart";

type Datum = { name: string; value: number };

export function PlanDonut({ data }: { data: Datum[] }) {
  return (
    <DonutChart
      data={data}
      height={220}
      formatter={(v: number, n: string) => `${n}: ${v}`}
    />
  );
}
