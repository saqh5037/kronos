import { listMyScores, type MyScoreRow } from "@/server/actions/scores";
import PushSubscribeButton from "@/components/atleta/PushSubscribeButton";
import { listMyPRs, type PRRow } from "@/server/actions/prs";
import {
  getAthleteHome,
  getMyAttendanceLast90d,
  getMyScoresTimeline,
  type AthleteHome,
  type MyAttendanceDay,
  type MyScoreTimelinePoint,
} from "@/server/actions/athlete-home";
import {
  getMyCapabilityProfile,
  type CapabilityProfile,
} from "@/server/analytics/capability";
import { formatScore } from "@/lib/scores";
import { formatDayMonth } from "@/lib/week";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import KCard from "@/components/kronos/KCard";
import MiniBarChart from "@/components/kronos/MiniBarChart";
import { MyHeatmap90d } from "./_components/MyHeatmap90d";
import { ScoresTimeline } from "./_components/ScoresTimeline";
import { CapabilityRadar } from "@/components/charts/CapabilityRadar";
import {
  getTop3PRPredictions,
  type PRPredictionCard as PRPredictionCardData,
} from "@/server/actions/ai";
import PRPredictionCard from "@/components/atleta/PRPredictionCard";
import { listMyGoals, type GoalRow } from "@/server/actions/goals";
import Link from "next/link";
import type { Route } from "next";

export const metadata = { title: "Kronos — Perfil" };

export default async function PerfilPage() {
  let home: AthleteHome = null;
  let prs: PRRow[] = [];
  let scores: MyScoreRow[] = [];
  let attendance90d: MyAttendanceDay[] = [];
  let scoresTimeline: MyScoreTimelinePoint[] = [];
  let capability: CapabilityProfile | null = null;
  let prPredictions: PRPredictionCardData[] = [];
  let myGoals: GoalRow[] = [];

  try {
    [home, prs, scores, attendance90d, scoresTimeline, prPredictions, myGoals] =
      await Promise.all([
        getAthleteHome(),
        listMyPRs(),
        listMyScores(30),
        getMyAttendanceLast90d(),
        getMyScoresTimeline(90),
        getTop3PRPredictions(),
        listMyGoals(),
      ]);
    capability = await getMyCapabilityProfile();
  } catch {
    // Sesión ausente
  }

  const activeGoals = myGoals.filter((g) => g.status === "ACTIVE");

  if (!home || !home.athlete) {
    return (
      <div className="p-4 pt-16">
        <p className="k-eyebrow mb-2">Atleta</p>
        <h1 className="font-display font-bold text-3xl">Mi perfil</h1>
        <div className="mt-6 k-card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Perfil no disponible.
          </p>
        </div>
      </div>
    );
  }

  const initials = `${home.athlete.firstName[0]}${home.athlete.lastName ? home.athlete.lastName[0] : ""}`;

  // Group scores by month for sparklines
  const scoresByMonth = new Map<string, MyScoreRow[]>();
  for (const s of scores) {
    const key = s.createdAt.toISOString().slice(0, 7); // YYYY-MM
    if (!scoresByMonth.has(key)) scoresByMonth.set(key, []);
    scoresByMonth.get(key)!.push(s);
  }

  return (
    <div className="pb-28 relative">
      {/* HERO PERFIL — radical brand redesign */}
      <header className="relative px-4 pt-14 pb-5 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 0% 50%, rgba(230,0,38,0.10), transparent 60%), radial-gradient(ellipse at 100% 50%, rgba(0,191,255,0.10), transparent 60%)",
          }}
        />
        <span className="k-corner-tl" aria-hidden />
        <span className="k-corner-br" aria-hidden />

        <AnimatedSection className="relative">
          <AnimatedItem>
            <span className="k-eyebrow-bar">Mi perfil · Atleta</span>
          </AnimatedItem>
          <AnimatedItem className="mt-3 flex items-center gap-3.5">
            <div className="relative shrink-0">
              <div
                className="w-[72px] h-[72px] rounded-full p-[2px]"
                style={{
                  background: "var(--grad)",
                  boxShadow: "0 0 24px rgba(0,68,255,0.32)",
                }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center font-display font-bold text-[26px] tracking-[-0.02em]"
                  style={{ background: "var(--card)" }}
                >
                  {initials}
                </div>
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 rounded-full p-[2px]"
                style={{ background: "var(--bg)" }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white"
                  style={{
                    background: "var(--brand-blue)",
                    boxShadow: "0 0 8px rgba(0,68,255,0.55)",
                  }}
                >
                  ✓
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1
                className="k-h-italic font-display font-extrabold text-xl sm:text-2xl md:text-[26px] leading-[1.1] tracking-[-0.02em] break-words"
                style={{ color: "var(--text)" }}
              >
                {home.athlete.firstName} <em>{home.athlete.lastName}</em>
              </h1>
              <div className="mt-1.5">
                <span className="k-chip k-chip-blue">ACTIVO · ATLETA</span>
              </div>
            </div>
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center k-glass shrink-0"
              aria-label="Ajustes"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.68 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </AnimatedItem>
        </AnimatedSection>
      </header>

      {/* RACHA HERO — brand radical */}
      <AnimatedSection className="px-3.5 pb-3.5">
        <AnimatedItem>
          <div className="k-card-brand relative">
            <span className="k-corner-tl" aria-hidden />
            <span className="k-corner-br" aria-hidden />
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden
              style={{
                background: "var(--grad-soft)",
                opacity: 0.7,
              }}
            />
            <div className="relative flex items-center gap-4 p-2">
              <div
                className="k-h-italic font-display font-extrabold leading-none"
                style={{
                  fontSize: "76px",
                  letterSpacing: "-0.04em",
                  background: "var(--grad)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  filter: "drop-shadow(0 4px 18px rgba(230,0,38,0.25))",
                }}
              >
                <em>{home.streak}</em>
              </div>
              <div className="flex-1">
                <span
                  className="font-script text-[22px] leading-none"
                  style={{ color: "var(--brand-red)" }}
                >
                  Días de
                </span>
                <div
                  className="font-display font-bold text-[18px] tracking-[-0.01em] mt-0.5"
                  style={{ color: "var(--text)" }}
                >
                  racha consecutiva
                </div>
                <div
                  className="text-[12px] leading-[1.5] mt-2"
                  style={{ color: "var(--text-2)" }}
                >
                  Vas por buen camino — no rompas hoy.
                </div>
              </div>
            </div>
          </div>
        </AnimatedItem>
      </AnimatedSection>

      {/* STATS GRID — dynamic layout */}
      <AnimatedSection className="px-3.5 pb-3.5 grid grid-cols-2 gap-2">
        <AnimatedItem className="col-span-1">
          <StatCard
            label="ASISTENCIAS"
            value={String(home.weekAttendance)}
            detail="ESTA SEMANA"
            color="var(--recovery)"
            size="lg"
          />
        </AnimatedItem>
        <AnimatedItem className="col-span-1">
          <StatCard
            label="PRs"
            value={String(home.prCount)}
            detail="TOTALES"
            color="var(--pr)"
            size="lg"
          />
        </AnimatedItem>
        <AnimatedItem className="col-span-1">
          <StatCard
            label="RACHA"
            value={String(home.streak)}
            detail="DÍAS"
            color="var(--strain)"
            size="sm"
          />
        </AnimatedItem>
        <AnimatedItem className="col-span-1">
          <StatCard
            label="SCORES"
            value={String(scores.length)}
            detail="REGISTRADOS"
            color="var(--text-2)"
            size="sm"
          />
        </AnimatedItem>
      </AnimatedSection>

      {/* PRs GRID */}
      {prs.length > 0 && (
        <AnimatedSection className="mt-2">
          <div className="flex items-baseline justify-between px-[18px] pb-2">
            <div className="k-eyebrow" style={{ color: "var(--text-2)" }}>
              RECORDS PERSONALES
            </div>
            <div
              className="font-mono text-[10px] font-bold tracking-[0.08em]"
              style={{ color: "var(--text-3)" }}
            >
              VER TODOS →
            </div>
          </div>
          <div className="px-3.5 grid grid-cols-2 gap-2">
            {prs.slice(0, 6).map((pr, i) => (
              <AnimatedItem key={pr.id}>
                <KCard>
                  <div className="p-3 relative">
                    <div
                      className="text-[11px] font-semibold mb-1.5 truncate"
                      style={{ color: "var(--text-2)" }}
                    >
                      {pr.movementName}
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span
                        className="font-display font-bold text-2xl"
                        style={{
                          letterSpacing: "-0.02em",
                          color: i === 0 ? "var(--recovery)" : "var(--text)",
                          textShadow:
                            i === 0 ? "0 0 10px rgba(25,240,139,0.3)" : "none",
                        }}
                      >
                        {pr.value}
                      </span>
                      <span
                        className="font-mono text-[11px] font-bold"
                        style={{ color: "var(--text-3)" }}
                      >
                        {pr.unit}
                      </span>
                    </div>
                    <div
                      className="font-mono text-[9px] font-bold tracking-[0.06em]"
                      style={{ color: "var(--text-3)" }}
                    >
                      {formatDayMonth(pr.achievedAt).toUpperCase()}
                    </div>
                  </div>
                </KCard>
              </AnimatedItem>
            ))}
          </div>
        </AnimatedSection>
      )}

      {/* OBJETIVOS — Plan IA brand */}
      {activeGoals.length > 0 && (
        <AnimatedSection className="mt-6">
          <div className="flex items-baseline justify-between px-[18px] pb-2.5">
            <span className="k-eyebrow-bar">Mis objetivos</span>
            <div
              className="font-mono text-[10px] font-bold tracking-[0.12em]"
              style={{ color: "var(--text-3)" }}
            >
              {activeGoals.length} ACTIVO{activeGoals.length === 1 ? "" : "S"}
            </div>
          </div>
          <div className="px-3.5 grid grid-cols-1 gap-2.5">
            {activeGoals.slice(0, 3).map((g) => (
              <AnimatedItem key={g.id}>
                <div className="k-card-brand relative">
                  <span className="k-corner-tr" aria-hidden />
                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div
                        className="k-h-italic font-display font-bold text-[18px] tracking-[-0.01em] truncate"
                        style={{ color: "var(--text)" }}
                      >
                        {g.movementName ? <em>{g.movementName}</em> : g.metric}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className="font-mono text-[10px] tracking-[0.08em] font-bold"
                          style={{ color: "var(--brand-blue)" }}
                        >
                          META {g.targetValue} {g.unit}
                        </span>
                        <span
                          aria-hidden
                          className="h-1 w-1 rounded-full"
                          style={{ background: "var(--text-3)" }}
                        />
                        <span
                          className="font-mono text-[10px] tracking-[0.08em] font-bold"
                          style={{ color: "var(--text-2)" }}
                        >
                          {Math.round(g.progress.pct)}%
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/atleta/plan?goalId=${g.id}` as Route}
                      className="k-btn-brand"
                      style={{
                        padding: "10px 18px",
                        fontSize: 11,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                      }}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      Plan IA
                    </Link>
                  </div>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </AnimatedSection>
      )}

      {/* PRÓXIMOS PRS — Gemini predictions */}
      {prPredictions.length > 0 && (
        <AnimatedSection className="mt-6">
          <div className="flex items-baseline justify-between px-[18px] pb-2.5">
            <span className="k-eyebrow-bar">Próximos PRs · Kronos AI</span>
            <div
              className="font-mono text-[10px] font-bold tracking-[0.12em]"
              style={{ color: "var(--text-3)" }}
            >
              REGRESIÓN + IA
            </div>
          </div>
          <div className="px-3.5 grid grid-cols-1 gap-2.5">
            {prPredictions.map((card) => (
              <PRPredictionCard key={card.movementId} card={card} />
            ))}
          </div>
        </AnimatedSection>
      )}

      {/* HISTORIAL */}
      {scores.length > 0 && (
        <AnimatedSection className="mt-5 px-3.5">
          <p className="k-eyebrow mb-2" style={{ color: "var(--text-2)" }}>
            HISTORIAL DE SCORES
          </p>
          <div className="flex flex-col gap-2">
            {scores.slice(0, 10).map((s) => (
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
                      style={{ color: "var(--text)" }}
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

      {/* ACTIVITY SPARKLINE — scores over time */}
      {scores.length >= 3 && (
        <AnimatedSection className="mt-5 px-3.5">
          <AnimatedItem>
            <KCard>
              <div className="p-4">
                <div className="k-eyebrow mb-3">ACTIVIDAD RECIENTE</div>
                <MiniBarChart
                  bars={scores
                    .slice(0, 7)
                    .reverse()
                    .map((s, i, arr) => {
                      const vals = arr.map((x) => Number(x.value));
                      const max = Math.max(...vals);
                      const min = Math.min(...vals);
                      const range = max - min || 1;
                      return {
                        value: Math.max(0.2, (Number(s.value) - min) / range),
                        label: formatDayMonth(s.createdAt).slice(0, 3),
                        isBest: Number(s.value) === max,
                      };
                    })}
                  height={56}
                />
              </div>
            </KCard>
          </AnimatedItem>
        </AnimatedSection>
      )}

      {/* PROGRESO TIMELINE */}
      {scoresTimeline.length >= 2 && (
        <AnimatedSection className="mt-5 px-3.5">
          <AnimatedItem>
            <KCard>
              <div className="p-4">
                <p
                  className="k-eyebrow mb-3"
                  style={{ color: "var(--text-2)" }}
                >
                  PROGRESO · ÚLTIMOS 90 DÍAS
                </p>
                <ScoresTimeline data={scoresTimeline} />
                <p
                  className="mt-2 text-[10px]"
                  style={{ color: "var(--text-3)" }}
                >
                  Valores normalizados 0–100 para comparar entre WODs.
                </p>
              </div>
            </KCard>
          </AnimatedItem>
        </AnimatedSection>
      )}

      {/* CAPABILITY RADAR */}
      {capability && capability.categories.length > 0 && (
        <AnimatedSection className="mt-5 px-3.5">
          <AnimatedItem>
            <KCard>
              <div className="p-4">
                <p
                  className="k-eyebrow mb-3"
                  style={{ color: "var(--text-2)" }}
                >
                  PERFIL DE CAPACIDADES
                </p>
                <CapabilityRadar
                  categories={capability.categories}
                  overallRank={capability.overallRank}
                  totalAthletes={capability.totalAthletes}
                  weakestCategory={capability.weakestCategory}
                  strongestCategory={capability.strongestCategory}
                  height={240}
                />
              </div>
            </KCard>
          </AnimatedItem>
        </AnimatedSection>
      )}

      {/* ASISTENCIA HEATMAP */}
      {attendance90d.length > 0 && (
        <AnimatedSection className="mt-5 px-3.5">
          <AnimatedItem>
            <KCard>
              <div className="p-4">
                <div className="mb-3 flex items-baseline justify-between">
                  <p className="k-eyebrow" style={{ color: "var(--text-2)" }}>
                    ASISTENCIA · ÚLTIMOS 90 DÍAS
                  </p>
                  <span
                    className="font-mono text-[10px] font-bold"
                    style={{ color: "var(--recovery)" }}
                  >
                    {attendance90d.length} clases
                  </span>
                </div>
                <MyHeatmap90d days={attendance90d} />
              </div>
            </KCard>
          </AnimatedItem>
        </AnimatedSection>
      )}

      {prs.length === 0 && scores.length === 0 && (
        <div className="px-3.5 mt-6">
          <KCard>
            <p
              className="text-sm text-center py-6"
              style={{ color: "var(--text-2)" }}
            >
              Aún no tienes scores ni PRs. Empieza subiendo tu primer score en
              /atleta/wod.
            </p>
          </KCard>
        </div>
      )}

      {/* NOTIFICACIONES PUSH */}
      <AnimatedSection className="mt-5 px-3.5">
        <AnimatedItem>
          <KCard>
            <div className="p-4">
              <p className="k-eyebrow mb-3" style={{ color: "var(--text-2)" }}>
                NOTIFICACIONES
              </p>
              <PushSubscribeButton />
            </div>
          </KCard>
        </AnimatedItem>
      </AnimatedSection>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  color,
  size = "lg",
}: {
  label: string;
  value: string;
  detail: string;
  color: string;
  size?: "lg" | "sm";
}) {
  return (
    <div className="k-card p-3.5 h-full flex flex-col justify-between">
      <div
        className="font-mono text-[9px] font-bold tracking-[0.14em] mb-2"
        style={{ color }}
      >
        {label}
      </div>
      <div
        className="font-display font-bold mb-1"
        style={{
          fontSize: size === "lg" ? 28 : 22,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      <div
        className="font-mono text-[9px] font-bold tracking-[0.08em]"
        style={{ color: "var(--text-3)" }}
      >
        {detail}
      </div>
    </div>
  );
}
