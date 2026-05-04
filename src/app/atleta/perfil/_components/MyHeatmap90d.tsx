"use client";

import { Heatmap } from "@/components/charts/Heatmap";
import { subDays, startOfDay } from "date-fns";
import type { MyAttendanceDay } from "@/server/actions/athlete-home";

export function MyHeatmap90d({ days }: { days: MyAttendanceDay[] }) {
  const to = new Date();
  const from = startOfDay(subDays(to, 89));
  const data = days.map((d) => ({ date: d.date, value: 1 }));
  return <Heatmap data={data} from={from} to={to} cellSize={11} cellGap={2} />;
}
