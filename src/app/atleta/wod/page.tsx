import Link from "next/link";
import {
  getTodayWOD,
  listMyScores,
  getMyWODPercentile,
  type TodayWOD,
  type MyScoreRow,
  type MyWODPercentile,
} from "@/server/actions/scores";
import ScoreForm from "@/components/ScoreForm";
import { formatScore } from "@/lib/scores";
import { formatTime, formatDayMonth } from "@/lib/week";
import type { ScoreType } from "@/lib/validations/wod";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import KCard from "@/components/kronos/KCard";
import MiniBarChart from "@/components/kronos/MiniBarChart";

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

  let percentile: MyWODPercentile | null = null;
  if (wod && wodScores.length > 0) {
    try {
      percentile = await getMyWODPercentile(wod.wodId);
    } catch {
      // ignore — show without percentile
    }
  }

  return (
    <div className="pb-28">
      {/* HEADER */}
      <AnimatedSection className="flex items-center justify-between px-4 pt-14 pb-2">
        <AnimatedItem>
          <Link
            href="/atleta"
            className="w-9 h-9 rounded-[10px] flex items-center justify-center k-card"
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
        </AnimatedItem>
        <AnimatedItem>
          <div className="k-eyebrow" style={{ color: "var(--text-2)" }}>
            {wod
              ? `WOD · ${formatDayMonth(wod.startsAt).toUpperCase()}`
              : "WOD"}
          </div>
        </AnimatedItem>
        <AnimatedItem>
          <button
            className="w-9 h-9 rounded-[10px] flex items-center justify-center k-card"
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
        </AnimatedItem>
      </AnimatedSection>

      {!wod ? (
        <div className="px-4 mt-6">
          <KCard>
            <p
              className="text-sm text-center py-6"
              style={{ color: "var(--text-2)" }}
            >
              No hay WOD programado para hoy todavía.
            </p>
          </KCard>
        </div>
      ) : (
        <>
          {/* HERO POSTER */}
          <AnimatedSection className="px-3.5 mt-3">
            <AnimatedItem>
              <div
                className="relative rounded-[18px] overflow-hidden"
                style={{
                  background: "var(--hero-bg)",
                  border: "1px solid var(--line)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                }}
              >
                {/* gradient backdrop */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse at 80% 0%, rgba(58,163,255,0.35), transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(25,240,139,0.25), transparent 60%)",
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
                        stroke="var(--text)"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#g2)" />
                </svg>

                <div className="relative p-5 pb-6">
                  <span className="k-chip k-chip-moss">● {wod.wodType}</span>

                  <div
                    className="font-display font-bold mt-3"
                    style={{
                      fontSize: 48,
                      lineHeight: 0.92,
                      letterSpacing: "-0.04em",
                      textShadow: "0 2px 20px rgba(0,0,0,0.3)",
                    }}
                  >
                    {wod.wodName}
                  </div>
                  <div
                    className="font-mono text-[11px] font-bold tracking-[0.18em] mt-2"
                    style={{ color: "var(--moss)" }}
                  >
                    {wod.scoreType}
                    {wod.timeCap ? ` · ${wod.timeCap}:00 CAP` : ""}
                  </div>

                  <div
                    className="flex gap-5 mt-5 pt-4"
                    style={{ borderTop: "1px solid var(--hero-line)" }}
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
            </AnimatedItem>
          </AnimatedSection>

          {/* MOVIMIENTOS */}
          {wod.movements.length > 0 && (
            <AnimatedSection className="mt-4 px-3.5">
              <AnimatedItem>
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
                      className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-[var(--hover-subtle)]"
                      style={{
                        borderBottom:
                          i < a.length - 1 ? "1px solid var(--line)" : "none",
                      }}
                    >
                      <div
                        className="font-display font-bold text-[28px] min-w-[42px] text-center"
                        style={{
                          color: "var(--steel)",
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
              </AnimatedItem>
            </AnimatedSection>
          )}

          {/* TU HISTORIAL */}
          {wodScores.length > 0 && (
            <AnimatedSection className="mt-4 px-3.5">
              <AnimatedItem>
                <div className="k-card overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: "1px solid var(--line)" }}
                  >
                    <span className="k-eyebrow">TU HISTORIAL</span>
                    <span
                      className="font-mono text-[10px] font-bold tracking-[0.08em]"
                      style={{ color: "var(--moss)" }}
                    >
                      {wodScores.length} INTENTOS
                    </span>
                  </div>
                  <div className="px-4 py-4">
                    <div className="mb-3.5 flex flex-wrap items-baseline gap-2.5">
                      <span
                        className="font-mono text-[10px] font-bold tracking-[0.12em]"
                        style={{ color: "var(--text-3)" }}
                      >
                        MEJOR
                      </span>
                      <span
                        className="font-display text-[28px] font-bold"
                        style={{
                          letterSpacing: "-0.02em",
                          color: "var(--moss)",
                          textShadow: "0 0 14px rgba(25,240,139,0.3)",
                        }}
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
                      {percentile && percentile.totalAthletes > 1 ? (
                        <span
                          className={`k-chip ${
                            percentile.percentile >= 75
                              ? "k-chip-moss"
                              : percentile.percentile >= 50
                                ? "k-chip-steel"
                                : "k-chip-ghost"
                          } text-[10px]`}
                          title={`Top ${100 - percentile.percentile}% del box · mejor que ${percentile.betterThan} de ${percentile.totalAthletes - 1} atletas`}
                        >
                          P{percentile.percentile} · {percentile.totalAthletes}{" "}
                          atletas
                        </span>
                      ) : null}
                    </div>

                    <MiniBarChart
                      bars={wodScores
                        .slice(0, 6)
                        .reverse()
                        .map((s, i, arr) => {
                          const vals = arr.map((x) => Number(x.value));
                          const max = Math.max(...vals);
                          const min = Math.min(...vals);
                          const range = max - min || 1;
                          const isBest =
                            s.scoreType === "TIME"
                              ? Number(s.value) === min
                              : Number(s.value) === max;
                          return {
                            value: Math.max(
                              0.15,
                              (Number(s.value) - min) / range,
                            ),
                            label: formatScore(Number(s.value), s.scoreType),
                            sublabel: formatDayMonth(s.createdAt),
                            isBest,
                          };
                        })}
                      height={72}
                    />
                  </div>
                </div>
              </AnimatedItem>
            </AnimatedSection>
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
        <AnimatedSection className="mt-6 px-3.5">
          <p className="k-eyebrow mb-2" style={{ color: "var(--text-2)" }}>
            Tus scores recientes
          </p>
          <div className="flex flex-col gap-2">
            {myScores.map((s) => (
              <AnimatedItem key={s.id}>
                <KCard variant="flat">
                  <div className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
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
                      style={{ color: "var(--moss)" }}
                    >
                      {formatScore(s.value, s.scoreType)}
                    </span>
                  </div>
                </KCard>
              </AnimatedItem>
            ))}
          </div>
        </AnimatedSection>
      )}
    </div>
  );
}
