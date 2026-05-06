import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { getMyMovementProfile } from "@/server/analytics/movement";
import {
  getMyPRProgression,
  type PRProgressionResult,
} from "@/server/actions/prs";
import { getMovementById } from "@/server/actions/movements";
import { getTodayWOD } from "@/server/actions/scores";
import { PRChart, type PRChartPoint } from "@/components/charts/PRChart";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import KCard from "@/components/kronos/KCard";
import { getEquipmentIcon } from "@/lib/equipment-icons";

export const metadata = { title: "Kronos — Movimiento" };

export default async function MovementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let profile: Awaited<ReturnType<typeof getMyMovementProfile>> = null;
  let progression: PRProgressionResult | null = null;
  let movementInfo: Awaited<ReturnType<typeof getMovementById>> = null;
  let todayWod = null;

  try {
    [profile, progression, movementInfo, todayWod] = await Promise.all([
      getMyMovementProfile(id),
      getMyPRProgression(id, 180),
      getMovementById(id),
      getTodayWOD(),
    ]);
  } catch {
    notFound();
  }

  if (!profile) notFound();

  const chartData: PRChartPoint[] =
    progression?.points.map((p) => ({
      date: p.date ?? "",
      value: p.value,
      delta: p.deltaPct ?? 0,
      isCurrentBest: p.isCurrentBest ?? false,
    })) ?? [];

  const isInTodayWod =
    todayWod?.movements.some((m) => m.movementId === id) ?? false;

  return (
    <div className="pb-28 relative">
      {/* HERO v2.0 */}
      <header className="relative px-4 pt-14 pb-5 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 0% 0%, rgba(230,0,38,0.06), transparent 60%), radial-gradient(ellipse at 100% 100%, rgba(0,191,255,0.06), transparent 60%)",
          }}
        />
        <span className="k-corner-tl" aria-hidden />
        <span className="k-corner-br" aria-hidden />
        <AnimatedSection className="relative">
          <AnimatedItem>
            <span className="k-eyebrow-bar">Movimiento</span>
            <h1
              className="k-h-italic font-display font-extrabold text-[34px] mt-2 leading-[1] tracking-[-0.02em]"
              style={{ color: "var(--text)" }}
            >
              <em>{profile.movementName}</em>
            </h1>
          </AnimatedItem>
        </AnimatedSection>
      </header>

      {/* Two-column layout on desktop */}
      <div className="px-3.5 mt-3 grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left column — video + description */}
        <div className="lg:col-span-3 space-y-4">
          {/* VIDEO EMBED */}
          {movementInfo?.videoUrl && (
            <AnimatedSection>
              <AnimatedItem>
                <div
                  className="rounded-2xl overflow-hidden border border-[var(--line)]"
                  style={{ aspectRatio: "16/9", background: "var(--bg-soft)" }}
                >
                  <iframe
                    src={movementInfo.videoUrl}
                    title={`Video: ${profile.movementName}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </AnimatedItem>
            </AnimatedSection>
          )}

          {/* DESCRIPCION */}
          {movementInfo?.standardDescription && (
            <AnimatedSection>
              <AnimatedItem>
                <KCard>
                  <div className="p-4">
                    <p className="k-eyebrow mb-2 text-[var(--text-2)]">
                      DESCRIPCIÓN
                    </p>
                    <p className="text-[13px] leading-relaxed whitespace-pre-line text-[var(--text-2)]">
                      {movementInfo.standardDescription}
                    </p>

                    {/* Equipment */}
                    {movementInfo.equipment.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[10px] font-mono font-bold tracking-wider text-[var(--text-3)] uppercase mb-2">
                          Equipo necesario
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {movementInfo.equipment.map((eq) => (
                            <span
                              key={eq}
                              className="inline-flex items-center gap-1.5 bg-[var(--card-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-2)]"
                            >
                              <span className="text-sm">
                                {getEquipmentIcon(eq)}
                              </span>
                              {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </KCard>
              </AnimatedItem>
            </AnimatedSection>
          )}
        </div>

        {/* Right column — stats + chart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats Grid */}
          <AnimatedSection className="grid grid-cols-2 gap-2">
            <AnimatedItem>
              <KCard variant="flat" className="p-3.5 text-center">
                <div className="font-display text-xl font-bold text-[var(--fire)]">
                  {profile.currentBest !== null
                    ? `${profile.currentBest}${profile.unit ? ` ${profile.unit}` : ""}`
                    : "—"}
                </div>
                <div className="text-[10px] font-bold tracking-wide mt-1 text-[var(--text-3)]">
                  PR ACTUAL{" "}
                  {profile.currentBest
                    ? profile.lastPR?.achievedAt
                      ? `· ${new Date(profile.lastPR.achievedAt).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}`
                      : ""
                    : ""}
                </div>
              </KCard>
            </AnimatedItem>

            <AnimatedItem>
              <KCard variant="flat" className="p-3.5 text-center">
                <div className="font-display text-xl font-bold text-[var(--moss)]">
                  {profile.percentileInBox}%
                </div>
                <div className="text-[10px] font-bold tracking-wide mt-1 text-[var(--text-3)]">
                  PERCENTIL EN BOX
                </div>
              </KCard>
            </AnimatedItem>

            <AnimatedItem>
              <KCard variant="flat" className="p-3.5 text-center">
                <div className="font-display text-xl font-bold text-[var(--steel)]">
                  #{profile.rankInBox}
                </div>
                <div className="text-[10px] font-bold tracking-wide mt-1 text-[var(--text-3)]">
                  RANK DE {profile.totalAthletesInBox}
                </div>
              </KCard>
            </AnimatedItem>

            <AnimatedItem>
              <KCard variant="flat" className="p-3.5 text-center">
                <div className="font-display text-xl font-bold text-[var(--amber)]">
                  {profile.frequency90d}
                </div>
                <div className="text-[10px] font-bold tracking-wide mt-1 text-[var(--text-3)]">
                  ENTRENOS 90D
                </div>
              </KCard>
            </AnimatedItem>
          </AnimatedSection>

          {/* Progression Chart */}
          <AnimatedSection>
            <AnimatedItem>
              <KCard className="p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-[13px] font-semibold text-[var(--text)]">
                    Progresión de PRs
                  </span>
                  <span className="text-[10px] font-bold tracking-wide text-[var(--text-3)]">
                    ÚLTIMOS 6 MESES
                  </span>
                </div>
                <PRChart
                  data={chartData}
                  unit={progression?.unit}
                  currentBest={progression?.currentBest}
                  height={200}
                />
                {progression && progression.totalAttempts > 0 && (
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <div className="text-center">
                      <div className="font-display text-sm font-bold text-[var(--text)]">
                        {progression.totalAttempts}
                      </div>
                      <div className="text-[9px] font-bold tracking-wide text-[var(--text-3)]">
                        INTENTOS
                      </div>
                    </div>
                    {progression.daysSinceLast !== null && (
                      <div className="text-center">
                        <div className="font-display text-sm font-bold text-[var(--text)]">
                          {progression.daysSinceLast}d
                        </div>
                        <div className="text-[9px] font-bold tracking-wide text-[var(--text-3)]">
                          ÚLTIMO
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </KCard>
            </AnimatedItem>
          </AnimatedSection>

          {/* Stale warning */}
          {profile.isStale && (
            <AnimatedSection>
              <AnimatedItem>
                <div
                  className="k-card-ghost p-4 flex items-center gap-3 rounded-xl"
                  style={{
                    borderColor: "var(--ember-line)",
                    background: "var(--ember-soft)",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--ember)"
                    strokeWidth="2"
                  >
                    <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--ember)]">
                      Movimiento sin entrenar
                    </div>
                    <div className="text-[11px] text-[var(--text-2)]">
                      Hace más de 30 días que no registras un PR. ¡Ponle foco!
                    </div>
                  </div>
                </div>
              </AnimatedItem>
            </AnimatedSection>
          )}
        </div>
      </div>

      {/* Sticky bottom bar — Today's WOD CTA */}
      {isInTodayWod && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-[var(--bg)]/90 backdrop-blur-lg border-t border-[var(--line)] lg:hidden">
          <Link href={`/atleta` as Route}>
            <div className="k-btn-grad w-full py-3 text-sm font-semibold text-center flex items-center justify-center gap-2">
              <span>🔥</span>
              Vamos a hacerlo
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      )}

      {/* Desktop CTA if in today's WOD */}
      {isInTodayWod && (
        <AnimatedSection className="px-3.5 mt-4 hidden lg:block">
          <AnimatedItem>
            <Link href={`/atleta` as Route}>
              <div className="k-card-featured p-4 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--fire)]">
                      Este movimiento está en tu WOD de hoy
                    </p>
                    <p className="text-xs text-[var(--text-3)]">
                      {todayWod?.wodName} · Empieza a entrenar
                    </p>
                  </div>
                </div>
                <span className="k-btn-grad px-4 py-2 text-xs font-semibold">
                  Vamos →
                </span>
              </div>
            </Link>
          </AnimatedItem>
        </AnimatedSection>
      )}
    </div>
  );
}
