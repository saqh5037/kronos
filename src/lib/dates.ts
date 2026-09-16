/**
 * Range presets for every admin filter — computed in the BOX timezone.
 *
 * Until the fase 0 fix wave this module used date-fns' `startOfDay`,
 * `endOfDay`, `startOfMonth` and `format`, all of which read the SERVER's
 * timezone. On a laptop set to Mexico City that is invisible; on the UTC
 * production host "últimos 30 días" resolved to a window shifted one day at
 * both edges, and `/admin/pagos` filed a payment collected at 20:00 CDMX under
 * the NEXT day (`TZ=Asia/Tokyo pnpm test` reproduced it).
 *
 * Every function takes the timezone explicitly and defaults to
 * `DEFAULT_BOX_TIMEZONE`, the same zone `src/lib/format.ts` renders in, so the
 * window a number was computed for and the label printed beside it can never
 * drift apart again. Callers that hold a `Box.timezone` should pass it.
 */
import { isValid, parseISO } from "date-fns";
import {
  DEFAULT_BOX_TIMEZONE,
  addCivilDays,
  civilDateInTz,
  civilDaysBetween,
  dayKeyInTz,
  endOfCivilDay,
  endOfCivilMonth,
  startOfCivilDay,
  startOfCivilMonth,
  subCivilMonths,
  parseDayKey,
} from "@/lib/tz";
import { formatDateShort } from "@/lib/format";

export type RangePresetKey =
  | "today"
  | "last7"
  | "last30"
  | "last90"
  | "thisMonth"
  | "lastMonth";

export type DateRange = { from: Date; to: Date; preset?: RangePresetKey };

export const RANGE_PRESET_LABELS: Record<RangePresetKey, string> = {
  today: "Hoy",
  last7: "Últimos 7 días",
  last30: "Últimos 30 días",
  last90: "Últimos 90 días",
  thisMonth: "Este mes",
  lastMonth: "Mes pasado",
};

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function rangeFromPreset(
  preset: RangePresetKey,
  now: Date = new Date(),
  timeZone: string = DEFAULT_BOX_TIMEZONE,
): DateRange {
  const today = civilDateInTz(now, timeZone);
  const endOfToday = endOfCivilDay(today, timeZone);
  const lastNDays = (days: number): DateRange => ({
    from: startOfCivilDay(addCivilDays(today, -(days - 1)), timeZone),
    to: endOfToday,
    preset,
  });

  switch (preset) {
    case "today":
      return { from: startOfCivilDay(today, timeZone), to: endOfToday, preset };
    case "last7":
      return lastNDays(7);
    case "last30":
      return lastNDays(30);
    case "last90":
      return lastNDays(90);
    case "thisMonth":
      return {
        from: startOfCivilDay(startOfCivilMonth(today), timeZone),
        to: endOfCivilDay(endOfCivilMonth(today), timeZone),
        preset,
      };
    case "lastMonth": {
      const prev = subCivilMonths(today, 1);
      return {
        from: startOfCivilDay(startOfCivilMonth(prev), timeZone),
        to: endOfCivilDay(endOfCivilMonth(prev), timeZone),
        preset,
      };
    }
  }
}

/**
 * The symmetric previous range for delta calculations: last30 → the 30 box
 * days before the current range, ending the day before it starts.
 */
export function previousRange(
  range: DateRange,
  timeZone: string = DEFAULT_BOX_TIMEZONE,
): DateRange {
  const from = civilDateInTz(range.from, timeZone);
  const to = civilDateInTz(range.to, timeZone);
  const span = Math.max(0, civilDaysBetween(from, to));
  const prevTo = addCivilDays(from, -1);
  const prevFrom = addCivilDays(prevTo, -span);
  return {
    from: startOfCivilDay(prevFrom, timeZone),
    to: endOfCivilDay(prevTo, timeZone),
  };
}

/**
 * A `YYYY-MM-DD` query param is a CIVIL day in the box, not an instant: it is
 * resolved to that day's first instant in `timeZone`. Parsing it with the
 * ambient zone is what made `?from=2026-01-01` start on 31 dec for half the
 * world.
 */
export function parseDateParam(
  value: string | null | undefined,
  timeZone: string = DEFAULT_BOX_TIMEZONE,
): Date | null {
  if (!value) return null;
  if (DAY_KEY_RE.test(value)) {
    const civil = parseDayKey(value);
    if (!Number.isFinite(civil.year) || !Number.isFinite(civil.month)) {
      return null;
    }
    const instant = startOfCivilDay(civil, timeZone);
    return isValid(instant) ? instant : null;
  }
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function rangeFromParams(
  params: {
    preset?: string | null;
    from?: string | null;
    to?: string | null;
  },
  timeZone: string = DEFAULT_BOX_TIMEZONE,
): DateRange {
  const presetKey = params.preset as RangePresetKey | undefined;
  if (presetKey && presetKey in RANGE_PRESET_LABELS) {
    return rangeFromPreset(presetKey, new Date(), timeZone);
  }
  const from = parseDateParam(params.from, timeZone);
  const to = parseDateParam(params.to, timeZone);
  if (from && to) {
    return {
      from: startOfCivilDay(civilDateInTz(from, timeZone), timeZone),
      to: endOfCivilDay(civilDateInTz(to, timeZone), timeZone),
    };
  }
  return rangeFromPreset("last30", new Date(), timeZone);
}

/** YYYY-MM-DD — stable key for grouping by box civil day. */
export function dayKey(
  date: Date,
  timeZone: string = DEFAULT_BOX_TIMEZONE,
): string {
  return dayKeyInTz(date, timeZone);
}

/** YYYY-MM — stable key for grouping by box civil month. */
export function monthKey(
  date: Date,
  timeZone: string = DEFAULT_BOX_TIMEZONE,
): string {
  const civil = civilDateInTz(date, timeZone);
  return `${civil.year}-${String(civil.month).padStart(2, "0")}`;
}

/** One entry per box civil day in the range, at that day's first instant. */
export function eachDayInRange(
  range: DateRange,
  timeZone: string = DEFAULT_BOX_TIMEZONE,
): Date[] {
  const first = civilDateInTz(range.from, timeZone);
  const last = civilDateInTz(range.to, timeZone);
  const span = civilDaysBetween(first, last);
  if (span < 0) return [];
  const out: Date[] = [];
  for (let i = 0; i <= span; i += 1) {
    out.push(startOfCivilDay(addCivilDays(first, i), timeZone));
  }
  return out;
}

export function formatRange(
  range: DateRange,
  timeZone: string = DEFAULT_BOX_TIMEZONE,
): string {
  if (range.preset && range.preset in RANGE_PRESET_LABELS) {
    return RANGE_PRESET_LABELS[range.preset];
  }
  return `${formatDateShort(range.from, timeZone)} – ${formatDateShort(range.to, timeZone)}`;
}

/**
 * Node and browser ICU disagree on the separator for the numeric-month
 * shapes ("15-may" vs "15 may"); the house style is a single space, no dots
 * and no "de" — the same normalisation `src/lib/format.ts` applies.
 */
function normalizeEsShort(value: string): string {
  return value
    .replace(/\./g, "")
    .replace(/,/g, "")
    .replace(/-/g, " ")
    .replace(/\bde\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** "15 may" with a zero-padded day. */
export function formatDayShort(
  date: Date,
  timeZone: string = DEFAULT_BOX_TIMEZONE,
): string {
  return normalizeEsShort(
    new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      timeZone,
    }).format(date),
  );
}

/** "may 26" */
export function formatMonthShort(
  date: Date,
  timeZone: string = DEFAULT_BOX_TIMEZONE,
): string {
  return normalizeEsShort(
    new Intl.DateTimeFormat("es-MX", {
      month: "short",
      year: "2-digit",
      timeZone,
    }).format(date),
  );
}
