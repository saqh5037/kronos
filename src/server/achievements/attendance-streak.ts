/**
 * Real attendance streak for the badge *display* path.
 *
 * Audit 2026-09-15: "30 días seguidos" showed 0 % while the athlete was on day
 * 7. The badge grid reads `AthleteState.attendanceStreak`, which comes from the
 * cached `Streak.count` row — written only on check-in, so it is stale or
 * absent for anyone whose attendance was recorded any other way.
 *
 * The unlock decision still runs off the cached counter (that path is a
 * transactional write with its own tests); what changed is that the number the
 * athlete *reads* is recomputed from the attendance rows themselves. The math
 * is pure and lives in `@/lib/streak`.
 */

import { withTenant } from "@/server/db";
import { streakFromBookings } from "@/lib/streak";

/** Attendance older than this cannot extend a streak that reaches today. */
export const STREAK_LOOKBACK_DAYS = 400;

export async function loadAttendanceStreak(
  tenantId: string,
  athleteId: string,
  now: Date = new Date(),
): Promise<number> {
  const db = withTenant(tenantId);
  const cutoff = new Date(
    now.getTime() - STREAK_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  );

  const rows = await db.booking.findMany({
    where: {
      athleteId,
      status: "ATTENDED",
      OR: [
        { checkedInAt: { gte: cutoff } },
        { class: { startsAt: { gte: cutoff } } },
      ],
    },
    select: { checkedInAt: true, class: { select: { startsAt: true } } },
  });

  return streakFromBookings(rows, now);
}
