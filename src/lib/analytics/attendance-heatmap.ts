/**
 * Attendance heatmap bucketing — pure, server-safe, timezone-aware.
 *
 * Audit 2026-09-15 (`/atleta/perfil`): `MyHeatmap90d` handed a bare
 * `new Date()` to the client `Heatmap`, which buckets every cell with
 * local-time `date-fns/format`. A 20:00 CDMX check-in is already the next
 * calendar day in UTC, so the cell an athlete saw depended on the device they
 * opened the app with — and the range endpoints drifted with it.
 *
 * The day an attendance belongs to is a BOX decision, not a device one, so it
 * is decided here, on the server, in the box timezone. The client only ever
 * receives day keys, re-anchored at noon UTC (see `dayKeyToUtcNoon`) so that
 * the chart's local-time formatting lands back on the same calendar day for
 * every timezone the product ships to.
 *
 * No React, no Prisma, no `date-fns`: `Intl.DateTimeFormat` carries the IANA
 * tz support, exactly like `src/lib/wod-date.ts` does for WOD days.
 */

/** Default box timezone. Kronos ships to Mexico first. */
export const MEXICO_CITY_TZ = "America/Mexico_City";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** One heatmap cell: a local calendar day and how many events landed on it. */
export type HeatmapDayBucket = {
  /** "YYYY-MM-DD" in the box timezone. */
  dateKey: string;
  value: number;
};

/**
 * Resolves the timezone to use. A box row can carry `null`, an empty string, or
 * a value the runtime does not know (hand-edited settings); none of those may
 * throw in a render path, so they all fall back to Mexico City.
 */
function resolveTimezone(timezone: string | null | undefined): string {
  if (!timezone) return MEXICO_CITY_TZ;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
    return timezone;
  } catch {
    return MEXICO_CITY_TZ;
  }
}

/**
 * "YYYY-MM-DD" for `instant` as seen in `timezone`.
 *
 * `en-CA` formats as YYYY-MM-DD natively, which keeps the key sortable as a
 * plain string.
 */
export function dayKeyInTimezone(
  instant: Date,
  timezone: string | null | undefined,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: resolveTimezone(timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/**
 * The instant to hand a client that buckets by LOCAL calendar day.
 *
 * Noon UTC is the safe anchor: it stays on `dateKey` for every UTC offset in
 * (-12h, +12h), which covers every inhabited timezone the product serves. The
 * alternative — sending midnight — flips the day for the entire western
 * hemisphere.
 */
export function dayKeyToUtcNoon(dateKey: string): Date {
  if (!DAY_KEY_RE.test(dateKey)) {
    throw new Error(`dayKeyToUtcNoon: expected YYYY-MM-DD, got "${dateKey}"`);
  }
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

/**
 * Groups attendance instants into one bucket per local calendar day, ascending.
 *
 * Two classes on the same local day produce ONE cell with `value: 2`, which is
 * what gives the chart its intensity; the previous code emitted `value: 1` per
 * row and let the client re-group them in its own timezone.
 */
export function heatmapDayBuckets(
  instants: readonly Date[],
  timezone: string | null | undefined,
): HeatmapDayBucket[] {
  const tz = resolveTimezone(timezone);
  const counts = new Map<string, number>();

  for (const instant of instants) {
    if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) continue;
    const key = dayKeyInTimezone(instant, tz);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([dateKey, value]) => ({ dateKey, value }));
}

/**
 * The inclusive day-key window the heatmap covers: `days` local days ending
 * today in the box timezone.
 */
export function heatmapRangeKeys(
  now: Date,
  timezone: string | null | undefined,
  days: number,
): { fromKey: string; toKey: string } {
  const tz = resolveTimezone(timezone);
  const toKey = dayKeyInTimezone(now, tz);
  const span = Math.max(1, Math.floor(days));
  // Step back on the noon-UTC anchor of the local day key, then read it back in
  // UTC: noon has 12h of slack either side, so a DST fold can never move the
  // result onto the neighbouring day.
  const fromKey = dayKeyInTimezone(
    new Date(dayKeyToUtcNoon(toKey).getTime() - (span - 1) * DAY_MS),
    "UTC",
  );
  return { fromKey, toKey };
}
