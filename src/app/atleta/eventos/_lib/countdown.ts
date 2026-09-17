/**
 * Pure countdown copy for athlete-facing dates.
 *
 * Audit 2026-09-15: dates were printed as bare uppercase mono ("3 DE OCTUBRE
 * DE 2026") with no sense of distance — the athlete had to do the arithmetic.
 * These helpers turn a date into "faltan 18 días" / "hoy" / "hace 3 días".
 *
 * Day boundaries are compared in UTC on purpose: the label must not flip
 * between the server render and the client, and the box timezone is handled
 * by the formatters in `@/lib/format`.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDayUTC(date: Date): number {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

/** Whole calendar days from `now` to `target`. Negative when target is past. */
export function daysUntil(target: Date, now: Date = new Date()): number {
  return Math.round((startOfDayUTC(target) - startOfDayUTC(now)) / MS_PER_DAY);
}

/**
 * "faltan 18 días" · "falta 1 día" · "hoy" · "ayer" · "hace 3 días".
 * Always lowercase so callers decide the casing.
 */
export function countdownLabel(target: Date, now: Date = new Date()): string {
  const days = daysUntil(target, now);
  if (days === 0) return "hoy";
  if (days === 1) return "mañana";
  if (days === -1) return "ayer";
  if (days > 1) return `faltan ${days} días`;
  return `hace ${Math.abs(days)} días`;
}

/** True when the date is strictly before today (UTC day granularity). */
export function isPastDay(target: Date, now: Date = new Date()): boolean {
  return daysUntil(target, now) < 0;
}
