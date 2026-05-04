import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  differenceInDays,
  format,
  eachDayOfInterval,
  isValid,
  parseISO,
} from "date-fns";

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

export function rangeFromPreset(
  preset: RangePresetKey,
  now: Date = new Date(),
): DateRange {
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now), preset };
    case "last7":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now), preset };
    case "last30":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now), preset };
    case "last90":
      return { from: startOfDay(subDays(now, 89)), to: endOfDay(now), preset };
    case "thisMonth":
      return { from: startOfMonth(now), to: endOfMonth(now), preset };
    case "lastMonth": {
      const prev = subMonths(now, 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev), preset };
    }
  }
}

/**
 * Returns the symmetric previous range for delta calculations.
 * E.g. last30 → the 30 days before the current range.
 */
export function previousRange(range: DateRange): DateRange {
  const days = differenceInDays(range.to, range.from);
  const to = endOfDay(subDays(range.from, 1));
  const from = startOfDay(subDays(to, days));
  return { from, to };
}

export function parseDateParam(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

export function rangeFromParams(params: {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
}): DateRange {
  const presetKey = params.preset as RangePresetKey | undefined;
  if (presetKey && presetKey in RANGE_PRESET_LABELS) {
    return rangeFromPreset(presetKey);
  }
  const from = parseDateParam(params.from);
  const to = parseDateParam(params.to);
  if (from && to) {
    return { from: startOfDay(from), to: endOfDay(to) };
  }
  return rangeFromPreset("last30");
}

/** YYYY-MM-DD — stable key for grouping by day. */
export function dayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** YYYY-MM — stable key for grouping by month. */
export function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function eachDayInRange(range: DateRange): Date[] {
  return eachDayOfInterval({ start: range.from, end: range.to });
}

export function formatRange(range: DateRange, locale = "es-MX"): string {
  if (range.preset && range.preset in RANGE_PRESET_LABELS) {
    return RANGE_PRESET_LABELS[range.preset];
  }
  const f = (d: Date) =>
    d.toLocaleDateString(locale, { day: "2-digit", month: "short" });
  return `${f(range.from)} – ${f(range.to)}`;
}

export function formatDayShort(date: Date, locale = "es-MX"): string {
  return date.toLocaleDateString(locale, { day: "2-digit", month: "short" });
}

export function formatMonthShort(date: Date, locale = "es-MX"): string {
  return date.toLocaleDateString(locale, { month: "short", year: "2-digit" });
}
