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
import { TourTriggerButton } from "@/components/tour/TourTriggerButton";
import { perfilTour } from "@/components/tour/tours/perfil";

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
          <p className="text-sm" style={{ color: "var(--k-t2)" }}>
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
      {/* HERO PERFIL — V3 */}
      <header className="relative px-4 pt-12 pb-4">
        <AnimatedSection className="relative">
          <AnimatedItem>
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.2em",
                color: "var(--k-t3)",
              }}
            >
              PERFIL · ATLETA
            </span>
          </AnimatedItem>
          <AnimatedItem className="mt-3 flex items-center gap-3.5">
            <div
              data-tour="perfil.hero"
              className="flex items-center gap-3.5 flex-1 min-w-0"
            >
              <div className="relative shrink-0">
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "var(--k-elevated)",
                    border: "1.5px solid var(--k-line)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--k-font-display)",
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "var(--k-t2)",
                    boxShadow: "0 0 8px rgba(255,255,255,0.06)",
                  }}
                >
                  {initials}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    lineHeight: 1.1,
                    color: "var(--k-t1)",
                    margin: 0,
                  }}
                >
                  {home.athlete.firstName} {home.athlete.lastName ?? ""}
                </h1>
                <div className="mt-1.5">
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "var(--k-font-display)",
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: "0.18em",
                      color: "var(--k-t2)",
                      background: "var(--k-elevated)",
                      border: "1px solid var(--k-line)",
                      padding: "3px 8px",
                      borderRadius: 999,
                      textTransform: "uppercase",
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "var(--k-t1)",
                      }}
                    />
                    Activo
                  </span>
                </div>
              </div>
            </div>
            <TourTriggerButton tourId={perfilTour.id} />
            <Link
              href="/atleta/ajustes"
              aria-label="Ajustes"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "var(--k-surface)",
                border: "1px solid var(--k-line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--k-t2)",
                flexShrink: 0,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.68 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          </AnimatedItem>
        </AnimatedSection>
      </header>

      {/* RACHA HERO — V3 lima neon */}
      <AnimatedSection className="px-3.5 pb-3.5">
        <AnimatedItem>
          <div
            data-tour="perfil.racha"
            className="k-grain"
            style={{
              background: "var(--k-surface)",
              border: "1px solid var(--k-line)",
              borderRadius: 16,
              padding: 20,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 76,
                  fontWeight: 700,
                  letterSpacing: "-0.05em",
                  color: "var(--k-t2)",
                  lineHeight: 1,
                  fontFeatureSettings: '"tnum" 1',
                }}
              >
                {home.streak}
              </div>
              <div className="flex-1">
                <span
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    color: "var(--k-t3)",
                    textTransform: "uppercase",
                    display: "block",
                  }}
                >
                  Racha activa
                </span>
                <div
                  style={{
                    fontFamily: "var(--k-font-body)",
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    color: "var(--k-t1)",
                    marginTop: 4,
                  }}
                >
                  días consecutivos
                </div>
                <div
                  style={{
                    fontFamily: "var(--k-font-body)",
                    fontSize: 12,
                    color: "var(--k-t2)",
                    lineHeight: 1.5,
                    marginTop: 8,
                  }}
                >
                  Vas por buen camino — no rompas hoy.
                </div>
              </div>
            </div>
          </div>
        </AnimatedItem>
      </AnimatedSection>

      {/* STATS GRID — dynamic layout */}
      <AnimatedSection
        data-tour="perfil.stats"
        className="px-3.5 pb-3.5 grid grid-cols-2 gap-2"
      >
        <AnimatedItem className="col-span-1">
          <StatCard
            label="ASISTENCIAS"
            value={String(home.weekAttendance)}
            detail="ESTA SEMANA"
            color="var(--k-t2)"
            size="lg"
          />
        </AnimatedItem>
        <AnimatedItem className="col-span-1">
          <StatCard
            label="PRs"
            value={String(home.prCount)}
            detail="TOTALES"
            color="var(--k-t2)"
            size="lg"
          />
        </AnimatedItem>
        <AnimatedItem className="col-span-1">
          <StatCard
            label="RACHA"
            value={String(home.streak)}
            detail="DÍAS"
            color="var(--k-t1)"
            size="sm"
          />
        </AnimatedItem>
        <AnimatedItem className="col-span-1">
          <StatCard
            label="SCORES"
            value={String(scores.length)}
            detail="REGISTRADOS"
            color="var(--k-t2)"
            size="sm"
          />
        </AnimatedItem>
      </AnimatedSection>

      {/* PRs GRID */}
      {prs.length > 0 && (
        <AnimatedSection className="mt-2">
          <div className="flex items-baseline justify-between px-[18px] pb-2">
            <div className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
              RECORDS PERSONALES
            </div>
            <div
              className="font-mono text-[10px] font-bold tracking-[0.08em]"
              style={{ color: "var(--k-t3)" }}
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
                      style={{ color: "var(--k-t2)" }}
                    >
                      {pr.movementName}
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span
                        className="font-display font-bold text-2xl"
                        style={{
                          letterSpacing: "-0.02em",
                          color: i === 0 ? "var(--k-t2)" : "var(--text)",
                          textShadow:
                            i === 0 ? "0 0 10px rgba(25,240,139,0.3)" : "none",
                        }}
                      >
                        {pr.value}
                      </span>
                      <span
                        className="font-mono text-[11px] font-bold"
                        style={{ color: "var(--k-t3)" }}
                      >
                        {pr.unit}
                      </span>
                    </div>
                    <div
                      className="font-mono text-[9px] font-bold tracking-[0.06em]"
                      style={{ color: "var(--k-t3)" }}
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
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.18em",
                color: "var(--k-t3)",
                textTransform: "uppercase",
              }}
            >
              Mis objetivos
            </span>
            <div
              className="font-mono text-[10px] font-bold tracking-[0.12em]"
              style={{ color: "var(--k-t3)" }}
            >
              {activeGoals.length} ACTIVO{activeGoals.length === 1 ? "" : "S"}
            </div>
          </div>
          <div className="px-3.5 grid grid-cols-1 gap-2.5">
            {activeGoals.slice(0, 3).map((g) => (
              <AnimatedItem key={g.id}>
                <div
                  style={{
                    position: "relative",
                    padding: 14,
                    background: "var(--k-surface)",
                    border: "1px solid var(--k-line)",
                    borderRadius: 16,
                    boxShadow: "0 0 14px rgba(200, 255, 45, 0.10)",
                  }}
                >
                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div
                        style={{
                          fontFamily: "var(--k-font-display)",
                          fontWeight: 700,
                          fontSize: 18,
                          letterSpacing: "-0.01em",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "var(--k-t1)",
                        }}
                      >
                        {g.movementName ?? g.metric}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--k-font-display)",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            color: "var(--k-t2)",
                            textTransform: "uppercase",
                          }}
                        >
                          META {g.targetValue} {g.unit}
                        </span>
                        <span
                          aria-hidden
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 999,
                            background: "var(--k-t3)",
                            display: "inline-block",
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "var(--k-font-display)",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            color: "var(--k-t2)",
                          }}
                        >
                          {Math.round(g.progress.pct)}%
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/atleta/plan?goalId=${g.id}` as Route}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "10px 16px",
                        background: "var(--k-t1)",
                        color: "var(--k-bg)",
                        fontFamily: "var(--k-font-display)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        borderRadius: 10,
                        boxShadow: "0 0 8px rgba(255,255,255,0.06)",
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
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.18em",
                color: "var(--k-t3)",
                textTransform: "uppercase",
              }}
            >
              Próximos PRs · Kronos AI
            </span>
            <div
              className="font-mono text-[10px] font-bold tracking-[0.12em]"
              style={{ color: "var(--k-t3)" }}
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
          <p className="k-eyebrow mb-2" style={{ color: "var(--k-t2)" }}>
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
                        style={{ color: "var(--k-t3)" }}
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
                <p className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
                  PROGRESO · ÚLTIMOS 90 DÍAS
                </p>
                <ScoresTimeline data={scoresTimeline} />
                <p
                  className="mt-2 text-[10px]"
                  style={{ color: "var(--k-t3)" }}
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
                <p className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
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
                  <p className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
                    ASISTENCIA · ÚLTIMOS 90 DÍAS
                  </p>
                  <span
                    className="font-mono text-[10px] font-bold"
                    style={{ color: "var(--k-t2)" }}
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
              style={{ color: "var(--k-t2)" }}
            >
              Aún no tienes scores ni PRs. Empieza subiendo tu primer score en
              /atleta/wod.
            </p>
          </KCard>
        </div>
      )}

      {/* HUB DE EXPLORACIÓN — accesos al resto de la app del atleta */}
      <AnimatedSection data-tour="perfil.explorar" className="mt-6 px-3.5">
        <AnimatedItem>
          <p className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
            EXPLORAR
          </p>
          <div className="grid grid-cols-2 gap-2">
            <HubCard
              href="/atleta/movimientos"
              label="Movimientos"
              hint="Biblioteca + cues"
              icon="dumbbell"
            />
            <HubCard
              href="/atleta/leaderboard"
              label="Ranking"
              hint="Top del box"
              icon="trophy"
            />
            <HubCard
              href="/atleta/historial"
              label="Historial"
              hint="Tus clases"
              icon="history"
            />
            <HubCard
              href="/atleta/plan"
              label="Plan IA"
              hint="Tu camino"
              icon="target"
            />
            <HubCard
              href="/atleta/pagos"
              label="Pagos"
              hint="Cuotas y comprobantes"
              icon="card"
            />
            <HubCard
              href="/atleta/ajustes"
              label="Ajustes"
              hint="Cuenta y privacidad"
              icon="settings"
            />
          </div>
        </AnimatedItem>
      </AnimatedSection>

      {/* NOTIFICACIONES PUSH */}
      <AnimatedSection className="mt-5 px-3.5">
        <AnimatedItem>
          <KCard>
            <div className="p-4">
              <p className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
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

type HubIcon =
  | "dumbbell"
  | "trophy"
  | "history"
  | "target"
  | "card"
  | "settings";

function HubCard({
  href,
  label,
  hint,
  icon,
}: {
  href: string;
  label: string;
  hint: string;
  icon: HubIcon;
}) {
  const iconNode = renderHubIcon(icon);

  return (
    <Link
      href={href as Route}
      className="k-tap"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-line)",
        borderRadius: 14,
        padding: "14px 12px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        textDecoration: "none",
        color: "var(--k-t1)",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: "var(--k-elevated)",
          border: "1px solid var(--k-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--k-t2)",
          flexShrink: 0,
        }}
      >
        {iconNode}
      </div>
      <div className="min-w-0 flex-1">
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: "var(--k-t1)",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 11,
            color: "var(--k-t3)",
            marginTop: 2,
          }}
        >
          {hint}
        </div>
      </div>
      <span
        aria-hidden
        style={{
          color: "var(--k-t3)",
          fontSize: 16,
          fontFamily: "var(--k-font-display)",
        }}
      >
        ›
      </span>
    </Link>
  );
}

function renderHubIcon(icon: HubIcon) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (icon === "dumbbell")
    return (
      <svg {...common}>
        <path d="M2 12h2M20 12h2M5 8h3v8H5zM16 8h3v8h-3zM8 12h8" />
      </svg>
    );
  if (icon === "trophy")
    return (
      <svg {...common}>
        <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
        <path d="M3 6h4M17 6h4M9 20h6M12 15v5" />
      </svg>
    );
  if (icon === "history")
    return (
      <svg {...common}>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </svg>
    );
  if (icon === "target")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    );
  if (icon === "card")
    return (
      <svg {...common}>
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M2 11h20M6 16h4" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .66.39 1.26 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.25.61.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.66 0-1.26.39-1.51 1z" />
    </svg>
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
        style={{ color: "var(--k-t3)" }}
      >
        {detail}
      </div>
    </div>
  );
}
