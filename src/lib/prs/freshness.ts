/**
 * Pure helpers for PR freshness / staleness detection. No DB, no auth.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Whole days elapsed since `date`. Returns null when the date is missing.
 * Floors the diff so "earlier today" returns 0.
 */
export function daysSinceLastAttempt(
  date: Date | string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (date === null || date === undefined) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  const diff = now.getTime() - d.getTime();
  if (diff < 0) return 0;
  return Math.floor(diff / MS_PER_DAY);
}

/**
 * A movement is "stale" for an athlete when they haven't PR'd it in
 * `thresholdDays` days. Returns false when there's no prior attempt
 * (the athlete hasn't started — different signal).
 */
export function isStale(
  lastAttempt: Date | string | null | undefined,
  thresholdDays = 30,
  now: Date = new Date(),
): boolean {
  const days = daysSinceLastAttempt(lastAttempt, now);
  if (days === null) return false;
  return days >= thresholdDays;
}
