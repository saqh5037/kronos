import {
  getTodayWOD,
  listMyScores,
  type TodayWOD,
  type MyScoreRow,
} from "@/server/actions/scores";
import ScoreForm from "@/components/ScoreForm";
import { formatScore } from "@/lib/scores";
import { formatTime, formatDayMonth } from "@/lib/week";

export const metadata = { title: "Kronos — WOD del día" };

export default async function WODPage() {
  let wod: TodayWOD = null;
  let myScores: MyScoreRow[] = [];

  try {
    [wod, myScores] = await Promise.all([getTodayWOD(), listMyScores(20)]);
  } catch {
    // Sesión ausente
  }

  return (
    <div className="p-4 pt-16 pb-24">
      <p className="k-eyebrow mb-1">WOD</p>
      <h1 className="font-display font-bold text-3xl">WOD del día</h1>

      {!wod ? (
        <div
          className="mt-6 p-6 rounded-xl border text-center"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            No hay WOD programado para hoy todavía.
          </p>
        </div>
      ) : (
        <>
          <div
            className="mt-6 p-4 rounded-xl border"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <p className="k-eyebrow" style={{ color: "var(--strain)" }}>
              {wod.wodType} · {wod.scoreType}
              {wod.timeCap && ` · ${wod.timeCap}min cap`}
            </p>
            <h2 className="font-display font-bold text-2xl mt-1">
              {wod.wodName}
            </h2>
            <p
              className="font-mono text-xs mt-1"
              style={{ color: "var(--text-3)" }}
            >
              Clase {formatTime(wod.startsAt)}
            </p>

            {wod.description && (
              <p
                className="text-sm mt-3 whitespace-pre-line"
                style={{ color: "var(--text-2)" }}
              >
                {wod.description}
              </p>
            )}

            {wod.movements.length > 0 && (
              <ul
                className="mt-4 flex flex-col gap-1 border-t pt-3"
                style={{ borderColor: "var(--line)" }}
              >
                {wod.movements.map((m, i) => (
                  <li
                    key={`${m.movementId}-${i}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {m.reps && (
                        <span
                          className="font-mono font-semibold mr-2"
                          style={{ color: "var(--strain)" }}
                        >
                          {m.reps}
                        </span>
                      )}
                      {m.name}
                    </span>
                    {m.weight && (
                      <span
                        className="font-mono text-xs"
                        style={{ color: "var(--text-3)" }}
                      >
                        {m.weight}kg
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4">
            <ScoreForm
              wodId={wod.wodId}
              scoreType={wod.scoreType}
              classId={wod.classId}
            />
          </div>
        </>
      )}

      {myScores.length > 0 && (
        <section className="mt-6">
          <p className="k-eyebrow mb-2" style={{ color: "var(--text-2)" }}>
            Tus scores recientes
          </p>
          <div className="flex flex-col gap-2">
            {myScores.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-xl border flex items-center justify-between gap-3"
                style={{
                  borderColor: "var(--line)",
                  background: "var(--card)",
                }}
              >
                <div className="min-w-0">
                  <p className="font-display font-semibold text-sm truncate">
                    {s.wodName}
                  </p>
                  <p
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--text-3)" }}
                  >
                    {formatDayMonth(s.createdAt)} · {s.scaling}
                  </p>
                </div>
                <span
                  className="font-mono font-bold text-sm"
                  style={{ color: "var(--recovery)" }}
                >
                  {formatScore(s.value, s.scoreType)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
