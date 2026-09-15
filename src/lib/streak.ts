/**
 * Pure streak math — no DB, no time mocking quirks.
 */

/**
 * Returns the start of `date` (00:00) in UTC. We use UTC to keep streak
 * counts deterministic across timezones; box-level locale handling is a
 * separate concern.
 */
function startOfDayUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function diffDaysUTC(a: Date, b: Date): number {
  const ms = startOfDayUTC(a).getTime() - startOfDayUTC(b).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

/**
 * Compute current attendance streak length given a set of attendance events.
 *
 * Rules:
 * - Each unique day with at least one ATTENDED event counts as 1 streak day.
 * - The streak is "current" if today OR yesterday has an event (1-day grace
 *   so a streak isn't broken before the day ends).
 * - Going back from the most recent event, the streak extends as long as
 *   each previous day with an event is exactly 1 calendar day before the
 *   previous one.
 */
export function computeAttendanceStreak(
  eventDates: Date[],
  now: Date = new Date(),
): number {
  if (eventDates.length === 0) return 0;

  // Unique days, sorted descending.
  const uniqueDays = Array.from(
    new Set(eventDates.map((d) => startOfDayUTC(d).getTime())),
  )
    .sort((a, b) => b - a)
    .map((t) => new Date(t));

  const today = startOfDayUTC(now);
  const mostRecent = uniqueDays[0];
  const gapToToday = diffDaysUTC(today, mostRecent);

  // No event in last 1 day → streak is broken
  if (gapToToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const gap = diffDaysUTC(uniqueDays[i - 1], uniqueDays[i]);
    if (gap === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Whether a cached streak is still "current" given its last event date.
 *
 * The streak count is persisted in the DB (`Streak.count`) and only recomputed
 * on check-in. Reading the raw count is wrong: an athlete who stopped attending
 * keeps showing a stale streak forever. Apply this gate at read time — the
 * streak is alive only if the last event was today or yesterday (same 1-day
 * grace as `computeAttendanceStreak`).
 */
export function isStreakCurrent(
  lastEventAt: Date | null,
  now: Date = new Date(),
): boolean {
  if (!lastEventAt) return false;
  return diffDaysUTC(startOfDayUTC(now), startOfDayUTC(lastEventAt)) <= 1;
}

export type AttendanceBookingRow = {
  checkedInAt: Date | null;
  class?: { startsAt: Date } | null;
};

/**
 * The day an ATTENDED booking counts for.
 *
 * `checkedInAt` is the truth when a coach checked the athlete in, but a large
 * share of rows (seed, retroactive marking) only carry the class start — the
 * gap behind the audit's "heatmap lights 4 cells against 17 clases".
 */
export function attendanceDayOf(booking: AttendanceBookingRow): Date | null {
  return booking.checkedInAt ?? booking.class?.startsAt ?? null;
}

/**
 * Streak length computed from raw booking rows instead of the cached
 * `Streak.count` (audit 2026-09-15: a 30-day badge showed 0 % on day 7 because
 * the cache is only written on check-in).
 */
export function streakFromBookings(
  rows: readonly AttendanceBookingRow[],
  now: Date = new Date(),
): number {
  const days = rows
    .map(attendanceDayOf)
    .filter((d): d is Date => d instanceof Date);
  return computeAttendanceStreak(days, now);
}
