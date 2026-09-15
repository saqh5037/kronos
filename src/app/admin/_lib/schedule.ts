/**
 * Chronology helpers for admin class lists (audit 2026-09-15, top issue #8).
 *
 * A class list is read as a timeline: it must be sorted by `startsAt`, grouped
 * by the LOCAL calendar day (never by the UTC slice of an ISO string — that is
 * what made evening classes land at the top of the next day's column in
 * Programación) and, when the heading says "próximas", finished classes must
 * not be in it.
 *
 * Pure functions only: no React and no `Date.now()` inside — `now` is always
 * passed in, so the behaviour is testable and server/client renders agree.
 */

export type ScheduledLike = {
  startsAt: Date | string;
  durationMin?: number | null;
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Ascending by `startsAt`. Returns a new array; the input is never mutated. */
export function sortClassesByStart<T extends ScheduledLike>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => toDate(a.startsAt).getTime() - toDate(b.startsAt).getTime(),
  );
}

/**
 * A class is finished once its end (`startsAt + durationMin`) is in the past.
 * Missing/invalid durations fall back to `DEFAULT_DURATION_MIN`, so a class
 * that just started is never hidden from the coach mid-session.
 */
export const DEFAULT_DURATION_MIN = 60;

export function isFinished(item: ScheduledLike, now: Date): boolean {
  const start = toDate(item.startsAt).getTime();
  const duration =
    typeof item.durationMin === "number" && item.durationMin > 0
      ? item.durationMin
      : DEFAULT_DURATION_MIN;
  return start + duration * 60_000 <= now.getTime();
}

/** Sorted, with finished classes removed — what "Próximas clases" must show. */
export function upcomingClasses<T extends ScheduledLike>(
  items: T[],
  now: Date,
): T[] {
  return sortClassesByStart(items.filter((c) => !isFinished(c, now)));
}

/**
 * The class a roster view should auto-select: the next one that has not
 * finished or — when the whole day is over — the last one, so the coach can
 * still review it. `null` for an empty list.
 */
export function pickNextClass<T extends ScheduledLike>(
  items: T[],
  now: Date,
): T | null {
  const sorted = sortClassesByStart(items);
  if (sorted.length === 0) return null;
  return sorted.find((c) => !isFinished(c, now)) ?? sorted[sorted.length - 1];
}

/**
 * `YYYY-MM-DD` in the runtime's local calendar. Grouping by
 * `toISOString().slice(0, 10)` is a bug: 18:00 in Mexico City is already the
 * next day in UTC.
 */
export function dayKeyLocal(date: Date | string): string {
  const d = toDate(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}
