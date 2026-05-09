import { redirect } from "next/navigation";
import {
  getWODLeaderboard,
  getMovementLeaderboard,
  getWeeklyAttendanceLeaderboard,
  listWODOptions,
  listMovementOptions,
} from "@/server/actions/leaderboards";
import LeaderboardView from "./LeaderboardView";
import { getBoxMode } from "@/server/actions/box-mode";

export const metadata = { title: "Kronos — Leaderboards" };

export default async function LeaderboardPage() {
  // Personal Box: leaderboard tiene 1 atleta, no aporta — redirect home.
  const { isPersonal } = await getBoxMode();
  if (isPersonal) redirect("/atleta");

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
    <LeaderboardView
      wodOptions={wodOptions}
      movementOptions={movementOptions}
      initialWODId={initialWODId}
      initialMovementId={initialMovementId}
      initialWODData={initialWODData}
      initialMovementData={initialMovementData}
      initialAttendanceData={attendanceData}
    />
  );
}
