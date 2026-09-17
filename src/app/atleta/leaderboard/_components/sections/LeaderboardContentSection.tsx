/**
 * LeaderboardContentSection — fetches all leaderboard data and renders the
 * interactive view.
 *
 * All five fetches (options × 2, attendance, initial WOD, initial movement)
 * run in parallel where possible. The two conditional fetches (WOD + movement
 * initial data) keep their original try/catch resilience.
 *
 * Attendance uses `getWeeklyAttendanceBoard` (not the flat admin list) so the
 * athlete's own row is pinned when it falls outside the visible ten — audit
 * 2026-09-15, "six strangers, no me".
 *
 * No request-cache needed: these fetches are consumed only here.
 */

import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import {
  getWODLeaderboard,
  getMovementLeaderboard,
  getWeeklyAttendanceBoard,
  listWODOptions,
  listMovementOptions,
} from "@/server/actions/leaderboards";
import LeaderboardView from "../../LeaderboardView";

export async function LeaderboardContentSection() {
  const [wodOptions, movementOptions, attendanceBoard] = await Promise.all([
    listWODOptions(),
    listMovementOptions(),
    getWeeklyAttendanceBoard(0),
  ]);

  const initialWODId = wodOptions[0]?.id ?? "";
  const initialMovementId = movementOptions[0]?.id ?? "";

  let initialWODData = null;
  let initialMovementData = null;

  if (initialWODId) {
    try {
      initialWODData = await getWODLeaderboard(initialWODId);
    } catch {
      initialWODData = null;
    }
  }

  if (initialMovementId) {
    try {
      initialMovementData = await getMovementLeaderboard(initialMovementId);
    } catch {
      initialMovementData = null;
    }
  }

  return (
    <>
      {/* 56px clears the 40px hamburger pinned at top:12 (see atleta/layout). */}
      <div style={{ padding: "56px 16px 0" }}>
        <AthleteBackLink href="/atleta" label="Inicio" />
      </div>
      <LeaderboardView
        wodOptions={wodOptions}
        movementOptions={movementOptions}
        initialWODId={initialWODId}
        initialMovementId={initialMovementId}
        initialWODData={initialWODData}
        initialMovementData={initialMovementData}
        initialAttendanceData={attendanceBoard}
      />
    </>
  );
}
