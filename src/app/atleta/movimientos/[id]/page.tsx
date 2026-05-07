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
      {/* HERO V3 — limpio */}
      <header
        style={{
          padding: "56px 20px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
          }}
        >
          MOVIMIENTO · ATLETA
        </span>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--k-t1)",
            margin: 0,
            lineHeight: 1.05,
          }}
        >
          {profile.movementName}
        </h1>
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
                  style={{
                    aspectRatio: "16/9",
                    background: "var(--k-elevated)",
                    border: "1px solid var(--k-line)",
                    borderRadius: 16,
                    overflow: "hidden",
                  }}
                >
                  <iframe
                    src={movementInfo.videoUrl}
                    title={`Video: ${profile.movementName}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: "100%", height: "100%", border: 0 }}
                  />
                </div>
              </AnimatedItem>
            </AnimatedSection>
          )}

          {/* DESCRIPCION V3 */}
          {movementInfo?.standardDescription && (
            <AnimatedSection>
              <AnimatedItem>
                <div
                  style={{
                    padding: 16,
                    background: "var(--k-surface)",
                    border: "1px solid var(--k-line)",
                    borderRadius: 16,
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "var(--k-t3)",
                      margin: "0 0 10px",
                    }}
                  >
                    Descripción
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.5,
                      whiteSpace: "pre-line",
                      color: "var(--k-t2)",
                      fontFamily: "var(--k-font-body)",
                      margin: 0,
                    }}
                  >
                    {movementInfo.standardDescription}
                  </p>

                  {movementInfo.equipment.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <p
                        style={{
                          fontFamily: "var(--k-font-display)",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: "var(--k-t3)",
                          margin: "0 0 8px",
                        }}
                      >
                        Equipo necesario
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        {movementInfo.equipment.map((eq) => (
                          <span
                            key={eq}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 10px",
                              borderRadius: 10,
                              background: "var(--k-elevated)",
                              border: "1px solid var(--k-line)",
                              color: "var(--k-t2)",
                              fontFamily: "var(--k-font-body)",
                              fontSize: 12,
                            }}
                          >
                            <span style={{ fontSize: 14 }}>
                              {getEquipmentIcon(eq)}
                            </span>
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedItem>
            </AnimatedSection>
          )}
        </div>

        {/* Right column — stats + chart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats Grid V3 */}
          <AnimatedSection className="grid grid-cols-2 gap-2">
            <AnimatedItem>
              <V3StatCard
                value={
                  profile.currentBest !== null
                    ? `${profile.currentBest}${profile.unit ? ` ${profile.unit}` : ""}`
                    : "—"
                }
                label={
                  profile.currentBest && profile.lastPR?.achievedAt
                    ? `PR ACTUAL · ${new Date(profile.lastPR.achievedAt).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}`
                    : "PR ACTUAL"
                }
                accent
              />
            </AnimatedItem>
            <AnimatedItem>
              <V3StatCard
                value={`${profile.percentileInBox}%`}
                label="PERCENTIL EN BOX"
              />
            </AnimatedItem>
            <AnimatedItem>
              <V3StatCard
                value={`#${profile.rankInBox}`}
                label={`RANK DE ${profile.totalAthletesInBox}`}
              />
            </AnimatedItem>
            <AnimatedItem>
              <V3StatCard
                value={String(profile.frequency90d)}
                label="ENTRENOS 90D"
              />
            </AnimatedItem>
          </AnimatedSection>

          {/* Progression Chart V3 */}
          <AnimatedSection>
            <AnimatedItem>
              <div
                style={{
                  padding: 16,
                  background: "var(--k-surface)",
                  border: "1px solid var(--k-line)",
                  borderRadius: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--k-t1)",
                    }}
                  >
                    Progresión de PRs
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      color: "var(--k-t3)",
                    }}
                  >
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 24,
                      marginTop: 14,
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontFamily: "var(--k-font-display)",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--k-t1)",
                        }}
                      >
                        {progression.totalAttempts}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--k-font-display)",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.16em",
                          color: "var(--k-t3)",
                          marginTop: 3,
                        }}
                      >
                        INTENTOS
                      </div>
                    </div>
                    {progression.daysSinceLast !== null && (
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontFamily: "var(--k-font-display)",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--k-t1)",
                          }}
                        >
                          {progression.daysSinceLast}d
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--k-font-display)",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.16em",
                            color: "var(--k-t3)",
                            marginTop: 3,
                          }}
                        >
                          ÚLTIMO
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AnimatedItem>
          </AnimatedSection>

          {/* Stale warning V3 */}
          {profile.isStale && (
            <AnimatedSection>
              <AnimatedItem>
                <div
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    background: "var(--k-elevated)",
                    border: "1px dashed var(--k-line-2)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--k-t2)"
                    strokeWidth="2"
                  >
                    <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--k-font-display)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--k-t1)",
                      }}
                    >
                      Movimiento sin entrenar
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--k-t2)",
                        fontFamily: "var(--k-font-body)",
                        marginTop: 2,
                      }}
                    >
                      Hace más de 30 días que no registras un PR. ¡Ponle foco!
                    </div>
                  </div>
                </div>
              </AnimatedItem>
            </AnimatedSection>
          )}
        </div>
      </div>

      {/* Sticky bottom bar V3 — Today's WOD CTA */}
      {isInTodayWod && (
        <div
          className="lg:hidden"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            padding: 12,
            background: "rgba(8,8,10,0.92)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid var(--k-line)",
          }}
        >
          <Link
            href={`/atleta` as Route}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "13px 16px",
              borderRadius: 12,
              background: "var(--k-accent)",
              color: "var(--k-accent-on)",
              fontFamily: "var(--k-font-display)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              textDecoration: "none",
              boxShadow: "var(--k-accent-glow)",
            }}
          >
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
          </Link>
        </div>
      )}

      {/* Desktop CTA V3 si in today's WOD */}
      {isInTodayWod && (
        <AnimatedSection className="px-3.5 mt-4 hidden lg:block">
          <AnimatedItem>
            <Link href={`/atleta` as Route} style={{ textDecoration: "none" }}>
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: "var(--k-surface)",
                  border: "1px solid var(--k-accent-line)",
                  boxShadow: "0 0 14px rgba(200, 255, 45, 0.16)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <p
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "var(--k-accent)",
                      margin: 0,
                    }}
                  >
                    En tu WOD de hoy
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--k-t1)",
                      fontFamily: "var(--k-font-body)",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {todayWod?.wodName} · Empieza a entrenar
                  </p>
                </div>
                <span
                  style={{
                    padding: "9px 14px",
                    borderRadius: 10,
                    background: "var(--k-accent)",
                    color: "var(--k-accent-on)",
                    fontFamily: "var(--k-font-display)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                  }}
                >
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

function V3StatCard({
  value,
  label,
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 14,
        background: "var(--k-surface)",
        border: "1px solid var(--k-line)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: accent ? "var(--k-accent)" : "var(--k-t1)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--k-t3)",
          marginTop: 6,
        }}
      >
        {label}
      </div>
    </div>
  );
}
