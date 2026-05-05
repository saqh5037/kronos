/**
 * Build a 7×24 attendance heatmap (day-of-week × hour) for an athlete.
 * Pure — no DB. Same shape as the box-level Heatmap component already in
 * the UI, so Kimi can reuse it.
 *
 * Day index: 0 = Sunday … 6 = Saturday (matches JS Date and the existing
 * box-level heatmap, no remapping needed in the UI).
 */

export type HeatmapEvent = {
  date: Date | string;
};

export type HeatmapCell = {
  day: number;
  hour: number;
  count: number;
};

function toDate(d: Date | string): Date {
  return typeof d === "string" ? new Date(d) : d;
}

/**
 * Get day-of-week (0-6) and hour (0-23) for a date in a given timezone.
 * Falls back to UTC when the timezone is invalid.
 */
function bucketParts(d: Date, tz: string): { day: number; hour: number } {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
      hour: "numeric",
      hour12: false,
    });
    const parts = fmt.formatToParts(d);
    const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
    const hr = parts.find((p) => p.type === "hour")?.value ?? "0";
    const dayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    let h = parseInt(hr, 10);
    if (h === 24) h = 0;
    return {
      day: dayMap[wd] ?? d.getUTCDay(),
      hour: Number.isFinite(h) ? h : d.getUTCHours(),
    };
  } catch {
    return { day: d.getUTCDay(), hour: d.getUTCHours() };
  }
}

/**
 * Build a sparse 7×24 grid of attendance counts.
 * Returns only cells with count > 0 (typical heatmap UI fills empty cells
 * with the lowest color band, so the consumer can densify if needed).
 */
export function buildAthleteHeatmap(
  events: HeatmapEvent[],
  tz = "UTC",
): HeatmapCell[] {
  const counts = new Map<string, HeatmapCell>();
  for (const e of events) {
    const d = toDate(e.date);
    if (Number.isNaN(d.getTime())) continue;
    const { day, hour } = bucketParts(d, tz);
    const k = `${day}-${hour}`;
    const cell = counts.get(k);
    if (cell) {
      cell.count += 1;
    } else {
      counts.set(k, { day, hour, count: 1 });
    }
  }
  return Array.from(counts.values()).sort(
    (a, b) => a.day - b.day || a.hour - b.hour,
  );
}
