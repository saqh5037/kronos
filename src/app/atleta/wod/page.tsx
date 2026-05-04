import Link from "next/link";
import {
  getTodayWOD,
  listMyScores,
  type TodayWOD,
  type MyScoreRow,
} from "@/server/actions/scores";
import ScoreForm from "@/components/ScoreForm";
import { formatScore } from "@/lib/scores";
import { formatTime, formatDayMonth } from "@/lib/week";
import type { ScoreType } from "@/lib/validations/wod";

export const metadata = { title: "Kronos — WOD del día" };

export default async function WODPage() {
  let wod: TodayWOD = null;
  let myScores: MyScoreRow[] = [];

  try {
    [wod, myScores] = await Promise.all([getTodayWOD(), listMyScores(20)]);
  } catch {
    // Sesión ausente
  }

  const wodScores = wod ? myScores.filter((s) => s.wodId === wod.wodId) : [];

  return (
    <div className="pb-24">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 pt-14 pb-2">
        <Link
          href="/atleta"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center"
          style={{ background: "var(--card)", border: "1px solid var(--line)" }}
          aria-label="Volver"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="k-eyebrow" style={{ color: "var(--text-2)" }}>
          {wod ? `WOD · ${formatDayMonth(wod.startsAt).toUpperCase()}` : "WOD"}
        </div>
        <button
          className="w-9 h-9 rounded-[10px] flex items-center justify-center"
          style={{ background: "var(--card)", border: "1px solid var(--line)" }}
          aria-label="Más opciones"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>
      </div>

      {!wod ? (
        <div className="px-4 mt-6">
          <div
            className="p-6 rounded-xl border text-center"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              No hay WOD programado para hoy todavía.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* HERO POSTER */}
          <div className="px-3.5 mt-3">
            <div
              className="relative rounded-[18px] overflow-hidden"
              style={{
                background: "#101316",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* gradient backdrop */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at 80% 0%, rgba(58,163,255,0.32), transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(25,240,139,0.22), transparent 60%)",
                }}
              />
              {/* grid texture */}
              <svg
                className="absolute inset-0"
                style={{ opacity: 0.07 }}
                width="100%"
                height="100%"
              >
                <defs>
                  <pattern
                    id="g2"
                    width="22"
                    height="22"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 22 0 L 0 0 0 22"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#g2)" />
              </svg>

              <div className="relative p-5 pb-6">
                <span className="k-chip k-chip-recovery">● {wod.wodType}</span>

                <div
                  className="font-display font-bold mt-3"
                  style={{
                    fontSize: 48,
                    lineHeight: 0.92,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {wod.wodName}
                </div>
                <div
                  className="font-mono text-[11px] font-bold tracking-[0.18em] mt-2"
                  style={{ color: "var(--recovery)" }}
                >
                  {wod.scoreType}
                  {wod.timeCap ? ` · ${wod.timeCap}:00 CAP` : ""}
                </div>

                <div
                  className="flex gap-5 mt-5 pt-4"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <div>
                    <div
                      className="font-mono text-[9px] font-bold tracking-[0.14em]"
                      style={{ color: "var(--text-3)" }}
                    >
                      CLASE
                    </div>
                    <div className="font-display font-bold text-lg mt-0.5">
                      {formatTime(wod.startsAt)}
                    </div>
                  </div>
                  <div>
                    <div
                      className="font-mono text-[9px] font-bold tracking-[0.14em]"
                      style={{ color: "var(--text-3)" }}
                    >
                      TIPO
                    </div>
                    <div className="font-display font-bold text-lg mt-0.5">
                      {wod.scoreType}
                    </div>
                  </div>
                  {wod.timeCap && (
                    <div>
                      <div
                        className="font-mono text-[9px] font-bold tracking-[0.14em]"
                        style={{ color: "var(--text-3)" }}
                      >
                        TIEMPO
                      </div>
                      <div className="font-display font-bold text-lg mt-0.5">
                        {wod.timeCap}:00
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MOVIMIENTOS */}
          {wod.movements.length > 0 && (
            <section className="mt-4 px-3.5">
              <div className="k-card overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid var(--line)" }}
                >
                  <span className="k-eyebrow">MOVIMIENTOS</span>
                  <span
                    className="font-mono text-[9px] font-bold tracking-[0.1em]"
                    style={{ color: "var(--text-3)" }}
                  >
                    {wod.movements.length} EJERCICIOS
                  </span>
                </div>
                {wod.movements.map((m, i, a) => (
                  <div
                    key={`${m.movementId}-${i}`}
                    className="flex items-center gap-3.5 px-4 py-3.5"
                    style={{
                      borderBottom:
                        i < a.length - 1 ? "1px solid var(--line)" : "none",
                    }}
                  >
                    <div
                      className="font-display font-bold text-[28px] min-w-[42px] text-center"
                      style={{
                        color: "var(--strain)",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {m.reps ?? "—"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{m.name}</div>
                      {m.weight && (
                        <div
                          className="font-mono text-[10px] font-semibold tracking-[0.04em] mt-0.5"
                          style={{ color: "var(--text-3)" }}
                        >
                          {m.weight} kg
                        </div>
                      )}
                      {m.notes && (
                        <div
                          className="text-[11px] mt-0.5"
                          style={{ color: "var(--text-2)" }}
                        >
                          {m.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TU HISTORIAL */}
          {wodScores.length > 0 && (
            <section className="mt-4 px-3.5">
              <div className="k-card overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid var(--line)" }}
                >
                  <span className="k-eyebrow">TU HISTORIAL</span>
                  <span
                    className="font-mono text-[10px] font-bold tracking-[0.08em]"
                    style={{ color: "var(--recovery)" }}
                  >
                    {wodScores.length} INTENTOS
                  </span>
                </div>
                <div className="px-4 py-4">
                  <div className="flex items-baseline gap-2.5 mb-3.5">
                    <span
                      className="font-mono text-[10px] font-bold tracking-[0.12em]"
                      style={{ color: "var(--text-3)" }}
                    >
                      MEJOR
                    </span>
                    <span
                      className="font-display font-bold text-[28px]"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {formatScore(
                        Number(wodScores[0].value),
                        wodScores[0].scoreType as ScoreType,
                      )}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--text-2)" }}
                    >
                      {wodScores[0].scaling}
                    </span>
                  </div>

                  {/* Mini bar chart */}
                  <div className="flex items-end gap-2 h-14 mb-2">
                    {wodScores
                      .slice(0, 6)
                      .reverse()
                      .map((s, i, arr) => {
                        const vals = arr.map((x) => Number(x.value));
                        const max = Math.max(...vals);
                        const min = Math.min(...vals);
                        const range = max - min || 1;
                        const h = ((Number(s.value) - min) / range) * 100;
                        const isBest =
                          s.scoreType === "TIME"
                            ? Number(s.value) === min
                            : Number(s.value) === max;
                        return (
                          <div key={s.id} className="flex-1 relative">
                            <div
                              className="w-full rounded-[3px]"
                              style={{
                                height: `${Math.max(20, h)}%`,
                                background: isBest
                                  ? "var(--grad)"
                                  : "rgba(255,255,255,0.12)",
                                minHeight: 8,
                                boxShadow: isBest
                                  ? "0 0 14px rgba(25,240,139,0.5)"
                                  : "none",
                              }}
                            />
                          </div>
                        );
                      })}
                  </div>
                  <div className="flex gap-2">
                    {wodScores
                      .slice(0, 6)
                      .reverse()
                      .map((s) => (
                        <div key={s.id} className="flex-1 text-center">
                          <div
                            className="font-mono text-[10px] font-bold tracking-[0.04em]"
                            style={{ color: "var(--text-2)" }}
                          >
                            {formatScore(
                              Number(s.value),
                              s.scoreType as ScoreType,
                            )}
                          </div>
                          <div
                            className="font-mono text-[9px] mt-0.5"
                            style={{ color: "var(--text-3)" }}
                          >
                            {formatDayMonth(s.createdAt)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SCORE FORM */}
          <div className="mt-4 px-3.5">
            <ScoreForm
              wodId={wod.wodId}
              scoreType={wod.scoreType}
              classId={wod.classId}
            />
          </div>
        </>
      )}

      {/* SCORES RECIENTES GENERALES */}
      {myScores.length > 0 && (
        <section className="mt-6 px-3.5">
          <p className="k-eyebrow mb-2" style={{ color: "var(--text-2)" }}>
            Tus scores recientes
          </p>
          <div className="flex flex-col gap-2">
            {myScores.map((s) => (
              <div
                key={s.id}
                className="k-card p-3 flex items-center justify-between gap-3"
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
