import {
  listWODOptions,
  getWODLeaderboard,
  getWeeklyAttendanceLeaderboard,
  type WODLeaderboard,
  type AttendanceLeader,
} from "@/server/actions/leaderboards";
import WODSelector from "@/components/WODSelector";
import Podium from "@/components/kronos/Podium";
import { formatScore } from "@/lib/scores";
import { formatDayMonth } from "@/lib/week";
import type { ScoreType } from "@/lib/validations/wod";

export const metadata = { title: "Kronos — Leaderboards" };

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ wod?: string }>;
}) {
  const params = await searchParams;

  let wodOptions: { id: string; name: string; scoreType: string }[] = [];
  let attendanceLeaders: AttendanceLeader[] = [];
  let board: WODLeaderboard | null = null;

  try {
    [wodOptions, attendanceLeaders] = await Promise.all([
      listWODOptions(),
      getWeeklyAttendanceLeaderboard(0),
    ]);
    const selectedWodId = params.wod ?? wodOptions[0]?.id;
    if (selectedWodId) {
      board = await getWODLeaderboard(selectedWodId);
    }
  } catch {
    // BD/sesión ausentes
  }

  const podiumData =
    board?.entries.slice(0, 3).map((e, idx) => ({
      rank: idx + 1,
      name: e.athleteName,
      value: e.value,
      scoreType: board.scoreType as ScoreType,
      scaling: e.scaling,
    })) ?? [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="k-eyebrow mb-1">Performance</p>
        <h1 className="font-display font-bold text-3xl tracking-tight">
          Leaderboards
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
          Mejor score por atleta y asistencia semanal
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* WOD leaderboard */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <WODSelector options={wodOptions} selected={params.wod} />
          </div>

          {!board || board.entries.length === 0 ? (
            <div
              className="p-6 rounded-xl border text-center"
              style={{
                borderColor: "var(--line)",
                background: "var(--card)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--text-2)" }}>
                {wodOptions.length === 0
                  ? "Sin WODs todavía. Crea uno en /admin/wods."
                  : "No hay scores RX para este WOD aún."}
              </p>
            </div>
          ) : (
            <div className="k-card overflow-hidden">
              <div
                className="px-4 py-3 border-b"
                style={{ borderColor: "var(--line)" }}
              >
                <h3 className="font-display font-bold text-base">
                  {board.wodName}
                </h3>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-3)" }}
                >
                  Score: {board.scoreType} · {board.entries.length} atleta
                  {board.entries.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="p-4">
                <Podium entries={podiumData} />

                <table className="w-full text-sm">
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--line)",
                        color: "var(--text-3)",
                      }}
                    >
                      <th className="text-left px-4 py-2 k-eyebrow w-12">#</th>
                      <th className="text-left px-4 py-2 k-eyebrow">Atleta</th>
                      <th className="text-left px-4 py-2 k-eyebrow">
                        Resultado
                      </th>
                      <th className="text-left px-4 py-2 k-eyebrow">Logrado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {board.entries.slice(3).map((e, idx) => (
                      <tr
                        key={e.athleteId}
                        style={{ borderBottom: "1px solid var(--line)" }}
                      >
                        <td
                          className="px-4 py-2 font-mono text-xs"
                          style={{ color: "var(--text-3)" }}
                        >
                          {idx + 4}
                        </td>
                        <td className="px-4 py-2 font-medium">
                          {e.athleteName}
                        </td>
                        <td className="px-4 py-2">
                          <span className="font-mono font-bold">
                            {formatScore(e.value, board.scoreType)}
                          </span>
                          {e.scaling !== "RX" && (
                            <span
                              className="ml-2 text-[10px]"
                              style={{ color: "var(--strain)" }}
                            >
                              {e.scaling}
                            </span>
                          )}
                        </td>
                        <td
                          className="px-4 py-2 font-mono text-xs"
                          style={{ color: "var(--text-3)" }}
                        >
                          {formatDayMonth(e.achievedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Weekly attendance leaderboard */}
        <div>
          <p className="k-eyebrow mb-3" style={{ color: "var(--text-2)" }}>
            Asistencia esta semana
          </p>
          <div className="k-card overflow-hidden">
            {attendanceLeaders.length === 0 ? (
              <p
                className="text-xs p-4 text-center"
                style={{ color: "var(--text-3)" }}
              >
                Sin check-ins esta semana.
              </p>
            ) : (
              <ul className="flex flex-col">
                {attendanceLeaders.slice(0, 5).map((a, idx) => (
                  <li
                    key={a.athleteId}
                    className="px-4 py-3 border-b last:border-b-0 flex items-center justify-between"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="font-mono text-xs w-6"
                        style={{
                          color:
                            idx === 0
                              ? "var(--recovery)"
                              : idx < 3
                                ? "var(--strain)"
                                : "var(--text-3)",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-medium text-sm truncate">
                        {a.athleteName}
                      </span>
                    </div>
                    <span
                      className="font-mono font-bold text-sm"
                      style={{
                        color: idx === 0 ? "var(--recovery)" : "var(--text)",
                      }}
                    >
                      {a.attendedCount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
