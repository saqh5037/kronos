/**
 * wod-date — timezone-aware date helpers for WOD day resolution.
 *
 * NO external dependencies. Uses Intl.DateTimeFormat for IANA tz support.
 * Server-only safe (no window/DOM usage).
 */

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns "YYYY-MM-DD" in the given IANA timezone for a UTC instant.
 *
 * Example: todayKeyInTz(new Date("2026-06-11T05:30Z"), "America/Mexico_City") → "2026-06-10"
 * because 05:30Z = 23:30 CDMX (UTC-6), still June 10 locally.
 */
export function todayKeyInTz(now: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA locale formats as YYYY-MM-DD natively
  return formatter.format(now);
}

/**
 * Returns the UTC { start, end } instants that correspond to local
 * 00:00:00.000 .. 23:59:59.999 of the given dateKey in the given timezone.
 *
 * Implementation: parse the local midnight as if it were in the target tz
 * using the Intl offset trick — no library needed.
 */
export function localDayWindow(
  dateKey: string,
  timezone: string,
): { start: Date; end: Date } {
  // Find UTC offset for local midnight of this date in the target timezone.
  // Trick: create a Date that, when interpreted in the target tz, reads as 00:00:00 local.
  // We do this by finding the UTC instant whose local-tz representation = dateKey 00:00.
  const start = localMidnightToUtc(dateKey, timezone);
  // end = start + 24h - 1ms (handles DST folds: still 23:59:59.999 local, never 25h or 23h)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

/**
 * Given a dateKey "YYYY-MM-DD" and a timezone, returns the UTC Date that
 * corresponds to local 00:00:00.000 of that day in the given timezone.
 */
function localMidnightToUtc(dateKey: string, timezone: string): Date {
  // Strategy: binary search is overkill. Use the offset at an approximate UTC instant.
  // Parse dateKey as noon UTC to avoid edge cases, then compute offset at that point.
  const [year, month, day] = dateKey.split("-").map(Number);
  const noonUtc = Date.UTC(year, month - 1, day, 12, 0, 0, 0);

  // Get the offset (in ms) at that UTC instant for this timezone.
  // Intl trick: format noonUtc in the target tz, then compare to UTC.
  const offsetMs = getUtcOffsetMs(new Date(noonUtc), timezone);

  // Local midnight UTC = UTC midnight minus the UTC offset
  // i.e., if TZ is UTC-6 (offsetMs = -6*3600000), local 00:00 = UTC 06:00
  const utcMidnight = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offsetMs;

  // Verify the result actually lands on local 00:00 (handles DST transitions near midnight)
  // If it doesn't match exactly, adjust by 1h increments (DST edge).
  let candidate = new Date(utcMidnight);
  const localKey = todayKeyInTz(candidate, timezone);
  if (localKey === dateKey) {
    // Ensure we're at the true local midnight (not 01:00 after a spring-forward)
    return snapToLocalMidnight(candidate, timezone, dateKey);
  }
  // Off by a day — adjust ±1 day and retry
  const correction =
    localKey < dateKey ? 24 * 60 * 60 * 1000 : -24 * 60 * 60 * 1000;
  candidate = new Date(utcMidnight + correction);
  return snapToLocalMidnight(candidate, timezone, dateKey);
}

/**
 * Given a UTC instant that is somewhere in the correct local calendar day,
 * walk backward hour-by-hour (or ms) until we find local 00:00:00.
 * For typical business use (no midnight-straddling DST), this converges in ≤24 steps.
 */
function snapToLocalMidnight(
  approx: Date,
  timezone: string,
  dateKey: string,
): Date {
  // Start from local 00:00 approximation by flooring to the start of the UTC day
  // and adding the offset again — then walk forward/back by hours.
  // Simpler: parse "YYYY-MM-DDT00:00:00" as if it were the local tz by using
  // the offset we already know.

  // Find the hour within the dateKey in local tz
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Walk from approx to find exact midnight
  // We know approx is within the correct local calendar day.
  // The offset at local midnight might differ from offset at noon (DST).
  // Compute the local time of approx and subtract the excess hours/minutes.
  const parts = fmt.formatToParts(approx);
  const localHour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const localMinute = Number(
    parts.find((p) => p.type === "minute")?.value ?? 0,
  );

  // Subtract to get back to local 00:00
  const candidate = new Date(
    approx.getTime() - localHour * 3600000 - localMinute * 60000,
  );

  // Verify
  const check = todayKeyInTz(candidate, timezone);
  if (check === dateKey) return candidate;

  // Rare DST edge: try ±1h
  for (const delta of [-3600000, 3600000, -7200000, 7200000]) {
    const alt = new Date(candidate.getTime() + delta);
    const altKey = todayKeyInTz(alt, timezone);
    if (altKey === dateKey) {
      return snapToLocalMidnight(alt, timezone, dateKey);
    }
  }

  // Fallback: return as-is (should not happen for valid IANA timezones)
  return candidate;
}

/**
 * Returns the UTC offset in milliseconds for a given instant in a timezone.
 * Positive = ahead of UTC (east), Negative = behind UTC (west).
 *
 * Example: America/Mexico_City (UTC-6) → -21600000
 */
function getUtcOffsetMs(instant: Date, timezone: string): number {
  // Format the instant in UTC and in the target timezone, then diff.
  const utcParts = getDateParts(instant, "UTC");
  const tzParts = getDateParts(instant, timezone);

  const utcMs = Date.UTC(
    utcParts.year,
    utcParts.month - 1,
    utcParts.day,
    utcParts.hour,
    utcParts.minute,
    utcParts.second,
  );
  const tzMs = Date.UTC(
    tzParts.year,
    tzParts.month - 1,
    tzParts.day,
    tzParts.hour,
    tzParts.minute,
    tzParts.second,
  );

  return tzMs - utcMs; // positive = east, negative = west
}

function getDateParts(
  date: Date,
  timezone: string,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/**
 * Returns "YYYY-MM-DD" in the given IANA timezone for the local calendar day
 * a class starts on.
 *
 * This is a named alias over todayKeyInTz to make call-sites self-documenting.
 * The key detail: a class stored as "2026-06-11T02:30Z" in UTC is a
 * 20:30 CDMX class on June 10 — this returns "2026-06-10" correctly.
 *
 * @param startsAt - UTC instant (Date or ISO string) from the DB
 * @param timezone - IANA timezone of the box
 */
export function classToWodDateKey(
  startsAt: Date | string,
  timezone: string,
): string {
  return todayKeyInTz(new Date(startsAt), timezone);
}

/**
 * Validates and clamps a dateKey to be within ±7 days of today (in box timezone).
 * Invalid format → returns today's key.
 * Out of range → returns clamped edge.
 *
 * @param dateKey - "YYYY-MM-DD" to validate
 * @param timezone - IANA timezone for "today" computation
 * @param now - UTC instant to use as "now" (default: new Date() — only pass for testing)
 */
export function clampDateKey(
  dateKey: string,
  timezone: string,
  now: Date = new Date(),
): string {
  const todayKey = todayKeyInTz(now, timezone);

  if (!DATE_KEY_RE.test(dateKey)) return todayKey;

  const todayMs = dateKeyToMs(todayKey);
  const targetMs = dateKeyToMs(dateKey);
  const diffDays = Math.round((targetMs - todayMs) / 86400000);

  if (diffDays < -7) return offsetDateKey(todayKey, -7);
  if (diffDays > 7) return offsetDateKey(todayKey, 7);
  return dateKey;
}

function dateKeyToMs(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function offsetDateKey(baseKey: string, days: number): string {
  const ms = dateKeyToMs(baseKey) + days * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Returns a human-readable label for a dateKey in es-MX format.
 * E.g. "2026-06-10" → "MIÉ 10 JUN"
 * All computation is pure (no Date.now()) — pass the date as string, returns string.
 */
export function formatDateNavLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  // Use noon UTC to avoid any DST/timezone ambiguity in the label itself
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const day = date
    .toLocaleDateString("es-MX", { weekday: "short", timeZone: "UTC" })
    .toUpperCase()
    .replace(".", "");
  const dayNum = String(d).padStart(2, "0");
  const month = date
    .toLocaleDateString("es-MX", { month: "short", timeZone: "UTC" })
    .toUpperCase()
    .replace(".", "");
  return `${day} ${dayNum} ${month}`;
}

/**
 * Returns navigation metadata for the WOD day nav bar.
 * All values are pre-computed server-side strings — pass to client as props.
 */
export type WodDayNav = {
  dateKey: string;
  isToday: boolean;
  label: string; // e.g. "MIÉ 10 JUN"
  headerLabel: string; // "WOD · HOY" or "WOD · MIÉ 10 JUN"
  prevKey: string | null; // null when at -7 bound
  nextKey: string | null; // null when at +7 bound
};

export function buildWodDayNav(dateKey: string, todayKey: string): WodDayNav {
  const targetMs = dateKeyToMs(dateKey);
  const todayMs = dateKeyToMs(todayKey);
  const diffDays = Math.round((targetMs - todayMs) / 86400000);

  const isToday = diffDays === 0;
  const label = formatDateNavLabel(dateKey);
  const headerLabel = isToday ? "WOD · HOY" : `WOD · ${label}`;

  const prevKey = diffDays > -7 ? offsetDateKey(dateKey, -1) : null;
  const nextKey = diffDays < 7 ? offsetDateKey(dateKey, 1) : null;

  return { dateKey, isToday, label, headerLabel, prevKey, nextKey };
}
