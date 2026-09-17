/**
 * Week math helpers — week starts on Monday (es-MX convention).
 *
 * The three formatters below used to call `toLocaleDateString` /
 * `toLocaleTimeString` with a locale but no `timeZone`, so they rendered in the
 * AMBIENT zone: the box's 06:00 class printed as 12:00 on a UTC host, and a
 * score logged at 22:30 CDMX was dated the next day. They now delegate to
 * `src/lib/format.ts`, which pins the box timezone explicitly and is the single
 * house style for dates and clocks (`formatDayMonth` therefore renders "5 sep",
 * not "05 sep" — same as every other date in the product).
 *
 * `src/lib` is deliberately outside the `to-locale-string` guard root (that is
 * where the explicit formatters live), which is how these three survived the
 * repo-wide sweep. `tests/unit/week-tz.test.ts` is the standing check.
 */

import {
  formatDateShort,
  formatTime24,
  formatWeekdayShort,
} from "@/lib/format";

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0=Sun..6=Sat
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
}

export function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setMilliseconds(end.getMilliseconds() - 1);
  return end;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** "mar" — in the box timezone. */
export function formatWeekday(date: Date, timeZone?: string): string {
  return formatWeekdayShort(date, timeZone);
}

/** "06:00" — 24-hour, in the box timezone. */
export function formatTime(date: Date, timeZone?: string): string {
  return formatTime24(date, timeZone);
}

/** "15 sep" — in the box timezone. */
export function formatDayMonth(date: Date, timeZone?: string): string {
  return formatDateShort(date, timeZone);
}
