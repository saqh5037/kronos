/**
 * LeaderboardContentSection — fetches all leaderboard data and renders the
 * interactive view.
 *
 * All five fetches (options × 2, attendance, initial WOD, initial movement)
 * run in parallel where possible. The two conditional fetches (WOD + movement
 * initial data) keep their original try/catch resilience.
 *
 * No request-cache needed: these fetches are consumed only here.
 */

import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import {
  getWODLeaderboard,
  getMovementLeaderboard,
  getWeeklyAttendanceLeaderboard,
  listWODOptions,
  listMovementOptions,
} from "@/server/actions/leaderboards";
import LeaderboardView from "../../LeaderboardView";

export async function LeaderboardContentSection() {
  const [wodOptions, movementOptions, attendanceData] = await Promise.all([
    listWODOptions(),
    listMovementOptions(),
    getWeeklyAttendanceLeaderboard(0),
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
      <div style={{ padding: "48px 16px 0" }}>
        <AthleteBackLink href="/atleta" label="Inicio" />
      </div>
      <LeaderboardView
        wodOptions={wodOptions}
        movementOptions={movementOptions}
        initialWODId={initialWODId}
        initialMovementId={initialMovementId}
        initialWODData={initialWODData}
        initialMovementData={initialMovementData}
        initialAttendanceData={attendanceData}
      />
    </>
  );
}
