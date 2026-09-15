import { Heatmap } from "@/components/charts/Heatmap";
import {
  dayKeyToUtcNoon,
  type HeatmapDayBucket,
} from "@/lib/analytics/attendance-heatmap";

/**
 * Server component — the calendar days are already decided.
 *
 * Audit 2026-09-15: this used to take raw attendance instants plus a local
 * `new Date()` for the range, and let the CLIENT `Heatmap` bucket them with
 * local-time `format()`. A 20:00 CDMX check-in is the next calendar day in UTC,
 * so cells jumped depending on the viewer's device. Bucketing now happens
 * server-side in the box timezone (`@/lib/analytics/attendance-heatmap`) and
 * only day keys cross the boundary; `dayKeyToUtcNoon` re-anchors them so the
 * chart's own local formatting lands back on the intended day.
 */
export function MyHeatmap90d({
  buckets,
  fromKey,
  toKey,
}: {
  buckets: HeatmapDayBucket[];
  /** First day of the window, "YYYY-MM-DD" in the box timezone. */
  fromKey: string;
  /** Last day of the window ("today" in the box timezone). */
  toKey: string;
}) {
  const data = buckets.map((b) => ({
    date: dayKeyToUtcNoon(b.dateKey),
    value: b.value,
  }));

  return (
    <Heatmap
      data={data}
      from={dayKeyToUtcNoon(fromKey)}
      to={dayKeyToUtcNoon(toKey)}
      cellSize={11}
      cellGap={2}
    />
  );
}
