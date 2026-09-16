/**
 * Timezone-explicit civil-day arithmetic.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 * Kronos formats every date in the box timezone (`src/lib/format.ts` pins
 * `America/Mexico_City`) but used to *compute* its windows with the plain
 * `Date` getters and with date-fns' `startOfDay` / `endOfDay` / `startOfMonth`,
 * all of which read the SERVER's timezone.
 *
 * On a laptop set to Mexico City the two agree and everything looks correct.
 * On the production EC2, whose clock is UTC, they do not, and the mismatch is
 * visible to users:
 *
 *   - "últimos 30 días" resolved to a window that covers 31 civil days in the
 *     box timezone, shifted by one day at both edges (owner reports);
 *   - the athlete plan printed "faltan 18 días · 2 oct", a countdown and a date
 *     that cannot both be true, because the countdown counted UTC civil days
 *     and the date was rendered in CDMX.
 *
 * Everything here takes the timezone as an argument and never touches the
 * ambient one, so the same input produces the same output on any machine.
 */

/**
 * The timezone every Kronos surface formats in today. `Box.timezone` exists in
 * the schema and callers that have a box should pass it; this is the fallback
 * for the ones that do not (and the value `src/lib/format.ts` has always used).
 */
export const DEFAULT_BOX_TIMEZONE = "America/Mexico_City";

/** A wall-clock calendar date, with no instant attached. */
export type CivilDate = { year: number; month: number; day: number };

/** A wall-clock date and time, with no instant attached. */
export type CivilDateTime = CivilDate & {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

const FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = FORMATTERS.get(timeZone);
  if (cached) return cached;

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  };

  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-CA", { ...options, timeZone });
  } catch {
    // An unknown timezone must never be the reason a dashboard 500s.
    formatter = new Intl.DateTimeFormat("en-CA", {
      ...options,
      timeZone: "UTC",
    });
  }
  FORMATTERS.set(timeZone, formatter);
  return formatter;
}

/** The wall-clock reading of `date` in `timeZone`. */
export function civilDateTimeInTz(date: Date, timeZone: string): CivilDateTime {
  const parts = partsFormatter(timeZone).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number.parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    // Some ICU builds still render midnight as "24" under h23.
    hour: read("hour") % 24,
    minute: read("minute"),
    second: read("second"),
    millisecond: date.getUTCMilliseconds(),
  };
}

/** The civil calendar date `date` falls on in `timeZone`. */
export function civilDateInTz(date: Date, timeZone: string): CivilDate {
  const { year, month, day } = civilDateTimeInTz(date, timeZone);
  return { year, month, day };
}

function offsetMsAt(instant: number, timeZone: string): number {
  const c = civilDateTimeInTz(new Date(instant), timeZone);
  const asUtc = Date.UTC(
    c.year,
    c.month - 1,
    c.day,
    c.hour,
    c.minute,
    c.second,
    c.millisecond,
  );
  return asUtc - instant;
}

/**
 * The instant at which `civil` is the wall clock in `timeZone`.
 *
 * Two passes: the first guesses the offset from the naive UTC reading, the
 * second re-reads it at the corrected instant. That is what makes the result
 * right across a DST edge, where the offset before and after differ. (Mexico
 * City has had no DST since 2022, but boxes elsewhere will.)
 */
export function instantFromCivil(
  civil: Partial<CivilDateTime> & CivilDate,
  timeZone: string,
): Date {
  const naive = Date.UTC(
    civil.year,
    civil.month - 1,
    civil.day,
    civil.hour ?? 0,
    civil.minute ?? 0,
    civil.second ?? 0,
    civil.millisecond ?? 0,
  );
  const firstPass = naive - offsetMsAt(naive, timeZone);
  return new Date(naive - offsetMsAt(firstPass, timeZone));
}

/** `YYYY-MM-DD` for the civil day `date` falls on in `timeZone`. */
export function dayKeyInTz(date: Date, timeZone: string): string {
  return formatDayKey(civilDateInTz(date, timeZone));
}

/** `YYYY-MM-DD` for a civil date. */
export function formatDayKey(civil: CivilDate): string {
  const month = String(civil.month).padStart(2, "0");
  const day = String(civil.day).padStart(2, "0");
  return `${civil.year}-${month}-${day}`;
}

/** Parses a `YYYY-MM-DD` key into its civil components. */
export function parseDayKey(key: string): CivilDate {
  const [year, month, day] = key.split("-").map((n) => Number.parseInt(n, 10));
  return { year, month, day };
}

/**
 * `civil` shifted by `days` calendar days.
 *
 * Walks through `Date.UTC` anchors rather than adding 24 h to a wall clock, so
 * a DST transition inside the span cannot drop or duplicate a day.
 */
export function addCivilDays(civil: CivilDate, days: number): CivilDate {
  const anchor = new Date(
    Date.UTC(civil.year, civil.month - 1, civil.day) + days * 86_400_000,
  );
  return {
    year: anchor.getUTCFullYear(),
    month: anchor.getUTCMonth() + 1,
    day: anchor.getUTCDate(),
  };
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). */
export function civilDaysBetween(from: CivilDate, to: CivilDate): number {
  const a = Date.UTC(from.year, from.month - 1, from.day);
  const b = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((b - a) / 86_400_000);
}

/** The first instant of `civil` in `timeZone`. */
export function startOfCivilDay(civil: CivilDate, timeZone: string): Date {
  return instantFromCivil({ ...civil, hour: 0 }, timeZone);
}

/** The last instant of `civil` in `timeZone` (`23:59:59.999` local). */
export function endOfCivilDay(civil: CivilDate, timeZone: string): Date {
  return instantFromCivil(
    { ...civil, hour: 23, minute: 59, second: 59, millisecond: 999 },
    timeZone,
  );
}

/** The first instant of the civil day `date` falls on in `timeZone`. */
export function startOfDayInTz(date: Date, timeZone: string): Date {
  return startOfCivilDay(civilDateInTz(date, timeZone), timeZone);
}

/** The last instant of the civil day `date` falls on in `timeZone`. */
export function endOfDayInTz(date: Date, timeZone: string): Date {
  return endOfCivilDay(civilDateInTz(date, timeZone), timeZone);
}

/** The first day of `civil`'s month. */
export function startOfCivilMonth(civil: CivilDate): CivilDate {
  return { year: civil.year, month: civil.month, day: 1 };
}

/** The last day of `civil`'s month, leap years included. */
export function endOfCivilMonth(civil: CivilDate): CivilDate {
  const firstOfNext = new Date(Date.UTC(civil.year, civil.month, 1));
  const last = new Date(firstOfNext.getTime() - 86_400_000);
  return {
    year: last.getUTCFullYear(),
    month: last.getUTCMonth() + 1,
    day: last.getUTCDate(),
  };
}

/** `civil` moved back `months` whole months, clamped to the shorter month. */
export function subCivilMonths(civil: CivilDate, months: number): CivilDate {
  const target = new Date(Date.UTC(civil.year, civil.month - 1 - months, 1));
  const year = target.getUTCFullYear();
  const month = target.getUTCMonth() + 1;
  const lastDay = endOfCivilMonth({ year, month, day: 1 }).day;
  return { year, month, day: Math.min(civil.day, lastDay) };
}
