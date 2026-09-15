/**
 * Period resolution, labelling and timezone-aware day-series generation.
 *
 * Pure module: no Prisma, no session, no Next APIs. Everything here is a
 * function of its arguments so the KPI contract can be unit-tested.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 * The 2026-09-15 product audit (P0 #6 / systemic issue S4, "one fact, many
 * numbers") found every admin money screen inventing its own window. One
 * visible symptom was the owner dashboard drawing an **April** x-axis under an
 * "últimos 30 días" label: the chart series was built from whatever rows the
 * query returned instead of from the requested period.
 *
 * The rule this module enforces:
 *   A day series ALWAYS covers exactly `from..to`, one entry per civil day in
 *   the BOX timezone — never one entry per row, never one entry per UTC day.
 */

import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  differenceInCalendarDays,
} from "date-fns";

/** Presets shared with `src/lib/dates.ts` (the URL contract of the filters). */
export type PeriodPreset =
  | "today"
  | "last7"
  | "last30"
  | "last90"
  | "thisMonth"
  | "lastMonth";

/**
 * Canonical Spanish labels. Lowercase on purpose: the label is meant to be
 * embedded next to a number ("$138,750 · últimos 30 días"); the UI capitalises
 * with CSS when it needs a heading.
 */
export const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  today: "hoy",
  last7: "últimos 7 días",
  last30: "últimos 30 días",
  last90: "últimos 90 días",
  thisMonth: "este mes",
  lastMonth: "mes pasado",
};

/** A resolved, immutable window. `tz` is the box IANA timezone. */
export type Period = {
  from: Date;
  to: Date;
  tz: string;
  preset?: PeriodPreset;
};

/** A resolved window plus its display label. */
export type LabelledPeriod = Period & { label: string };

export type PeriodInput = {
  preset?: PeriodPreset | string | null;
  from?: Date | null;
  to?: Date | null;
  tz?: string | null;
};

export const DEFAULT_PERIOD_PRESET: PeriodPreset = "last30";
export const DEFAULT_TIMEZONE = "UTC";

/**
 * Deterministic Spanish month abbreviations.
 *
 * `toLocaleDateString("es-MX", { month: "short" })` renders September as
 * "sept" on some ICU builds and "sep" on others, so labels drift between the
 * server and the browser (and between Node versions). The audit asked for
 * stable labels, so we own the table.
 */
const MONTHS_ES_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

const DAY_KEY_FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function dayKeyFormatter(tz: string): Intl.DateTimeFormat {
  const cached = DAY_KEY_FORMATTERS.get(tz);
  if (cached) return cached;
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  let fmt: Intl.DateTimeFormat;
  try {
    // "en-CA" renders YYYY-MM-DD, which is exactly the key shape we want.
    fmt = new Intl.DateTimeFormat("en-CA", { ...options, timeZone: tz });
  } catch {
    // Unknown/invalid timezone: degrade to UTC rather than crash a dashboard.
    fmt = new Intl.DateTimeFormat("en-CA", { ...options, timeZone: "UTC" });
  }
  DAY_KEY_FORMATTERS.set(tz, fmt);
  return fmt;
}

/**
 * `YYYY-MM-DD` for the civil day that `date` falls on **in `tz`**.
 *
 * This is the only day bucket the summary uses. `src/lib/dates.ts#dayKey`
 * buckets in the server's local timezone, which is why an evening CDMX class
 * (20:30 local = 02:30Z the next day) could land on the wrong day.
 */
export function dayKeyInTz(date: Date, tz: string = DEFAULT_TIMEZONE): string {
  const parts = dayKeyFormatter(tz).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Parses a `YYYY-MM-DD` key into its civil components. */
export function parseDayKey(key: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = key.split("-").map((n) => Number.parseInt(n, 10));
  return { year, month, day };
}

/**
 * Every civil day key between `from` and `to` inclusive, in the box timezone.
 *
 * Enumeration walks civil dates through `Date.UTC` anchors, so it is immune to
 * DST transitions in the box timezone (adding 24 h to a wall clock is not).
 */
export function eachDayKeyInPeriod(period: {
  from: Date;
  to: Date;
  tz?: string | null;
}): string[] {
  const tz = period.tz || DEFAULT_TIMEZONE;
  const firstKey = dayKeyInTz(period.from, tz);
  const lastKey = dayKeyInTz(period.to, tz);

  const first = parseDayKey(firstKey);
  const last = parseDayKey(lastKey);

  let cursor = Date.UTC(first.year, first.month - 1, first.day);
  const end = Date.UTC(last.year, last.month - 1, last.day);

  // Inverted range: emit the single starting day rather than an empty series,
  // so a chart never renders "sin datos" for what is really a bad filter.
  if (end < cursor) return [firstKey];

  const keys: string[] = [];
  while (cursor <= end) {
    const d = new Date(cursor);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    keys.push(`${y}-${m}-${day}`);
    cursor += 86400000;
  }
  return keys;
}

function formatCivilDay(key: string, opts: { withYear: boolean }): string {
  const { year, month, day } = parseDayKey(key);
  const monthName = MONTHS_ES_SHORT[month - 1] ?? "";
  return opts.withYear ? `${day} ${monthName} ${year}` : `${day} ${monthName}`;
}

/**
 * The label every KPI must render next to its number.
 *
 * - preset windows use the canonical Spanish label ("últimos 30 días")
 * - a custom window inside one month collapses to "1–15 sep"
 * - a custom window across months reads "28 ago – 15 sep"
 * - a custom window across years keeps both years
 * - a one-day window drops the dash entirely ("15 sep")
 */
export function periodLabel(period: {
  from: Date;
  to: Date;
  tz?: string | null;
  preset?: PeriodPreset;
}): string {
  if (period.preset && period.preset in PERIOD_PRESET_LABELS) {
    return PERIOD_PRESET_LABELS[period.preset];
  }

  const tz = period.tz || DEFAULT_TIMEZONE;
  const fromKey = dayKeyInTz(period.from, tz);
  const toKey = dayKeyInTz(period.to, tz);

  const a = parseDayKey(fromKey);
  const b = parseDayKey(toKey);

  if (fromKey === toKey) {
    return formatCivilDay(fromKey, { withYear: false });
  }
  if (a.year !== b.year) {
    return `${formatCivilDay(fromKey, { withYear: true })} – ${formatCivilDay(
      toKey,
      { withYear: true },
    )}`;
  }
  if (a.month === b.month) {
    // en dash, no spaces — "1–15 sep"
    return `${a.day}–${b.day} ${MONTHS_ES_SHORT[b.month - 1] ?? ""}`;
  }
  return `${formatCivilDay(fromKey, { withYear: false })} – ${formatCivilDay(
    toKey,
    { withYear: false },
  )}`;
}

function windowForPreset(
  preset: PeriodPreset,
  now: Date,
): { from: Date; to: Date } {
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "last7":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "last30":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case "last90":
      return { from: startOfDay(subDays(now, 89)), to: endOfDay(now) };
    case "thisMonth":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "lastMonth": {
      const prev = subMonths(now, 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    }
  }
}

function asPreset(value: PeriodInput["preset"]): PeriodPreset | undefined {
  if (!value) return undefined;
  return (value as string) in PERIOD_PRESET_LABELS
    ? (value as PeriodPreset)
    : undefined;
}

/**
 * Resolves whatever the page has (a preset key, an explicit pair, or nothing)
 * into one labelled window. An explicit `from`/`to` pair always wins over a
 * preset, and an inverted pair is swapped instead of yielding an empty series.
 */
export function resolvePeriod(
  input: PeriodInput = {},
  now: Date = new Date(),
): LabelledPeriod {
  const tz = input.tz || DEFAULT_TIMEZONE;

  if (input.from && input.to) {
    const [from, to] =
      input.from.getTime() <= input.to.getTime()
        ? [input.from, input.to]
        : [input.to, input.from];
    const period: Period = { from, to, tz };
    return { ...period, label: periodLabel(period) };
  }

  const preset = asPreset(input.preset) ?? DEFAULT_PERIOD_PRESET;
  const { from, to } = windowForPreset(preset, now);
  const period: Period = { from, to, tz, preset };
  return { ...period, label: periodLabel(period) };
}

/**
 * The symmetric window immediately before `period`, used for every delta.
 * Guaranteed not to overlap the current window.
 */
export function previousPeriodOf(period: Period): LabelledPeriod {
  const spanDays = Math.max(
    0,
    differenceInCalendarDays(period.to, period.from),
  );
  const to = endOfDay(subDays(period.from, 1));
  const from = startOfDay(subDays(to, spanDays));
  const prev: Period = { from, to, tz: period.tz };
  return { ...prev, label: periodLabel(prev) };
}
