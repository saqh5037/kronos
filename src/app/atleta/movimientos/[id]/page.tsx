import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, TriangleAlert } from "lucide-react";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import {
  cleanMovementDescription,
  equipmentLabel,
  muscleLabel,
} from "../_lib/movement-i18n";
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
import { EquipmentIcon } from "@/lib/equipment-icons";
import { formatDateShort } from "@/lib/format";

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

  const statTiles: { value: string; label: string; accent?: boolean }[] = [];
  if (profile.currentBest !== null) {
    statTiles.push({
      value: `${profile.currentBest}${profile.unit ? ` ${profile.unit}` : ""}`,
      label: profile.lastPR?.achievedAt
        ? `PR ACTUAL · ${formatDateShort(new Date(profile.lastPR.achievedAt))}`
        : "PR ACTUAL",
      accent: true,
    });
  }
  if (profile.frequency90d > 0) {
    statTiles.push({
      value: String(profile.frequency90d),
      label: profile.frequency90d === 1 ? "ENTRENO 90D" : "ENTRENOS 90D",
    });
  }
  // No rank at all (no mark on this movement), or a rank inside a box of one,
  // tells the athlete nothing.
  if (profile.rankInBox !== null && profile.totalAthletesInBox > 1) {
    statTiles.push({
      value: `#${profile.rankInBox}`,
      label: `DE ${profile.totalAthletesInBox} EN EL BOX`,
    });
    statTiles.push({
      value: `${profile.percentileInBox}%`,
      label: "PERCENTIL EN BOX",
    });
  }

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
        {/* Left gutter keeps the back link clear of the fixed hamburger. */}
        <div className="pl-12 lg:pl-0" style={{ marginBottom: 4 }}>
          <AthleteBackLink href="/atleta/movimientos" label="Movimientos" />
        </div>
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
                    {/* Seeded copy leaks model scaffolding ("Score: weight
                        (kg). Tips RX: …"); strip it at the boundary. */}
                    {cleanMovementDescription(movementInfo.standardDescription)}
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
                            <EquipmentIcon name={eq} size={14} />
                            {equipmentLabel(eq)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedItem>
            </AnimatedSection>
          )}

          {/* CUES — Haz esto / No hagas esto */}
          {movementInfo?.cues &&
            ((movementInfo.cues.dos?.length ?? 0) > 0 ||
              (movementInfo.cues.donts?.length ?? 0) > 0 ||
              (movementInfo.cues.setup?.length ?? 0) > 0) && (
              <AnimatedSection>
                <AnimatedItem>
                  <div
                    data-testid="movement-cues"
                    style={{
                      padding: 16,
                      background: "var(--k-surface)",
                      border: "1px solid var(--k-line)",
                      borderRadius: 16,
                      display: "grid",
                      gap: 14,
                    }}
                  >
                    <p
                      className="k-eyebrow"
                      style={{ color: "var(--k-t3)", margin: 0 }}
                    >
                      Cómo ejecutarlo
                    </p>
                    {movementInfo.cues.setup &&
                      movementInfo.cues.setup.length > 0 && (
                        <CueList
                          title="Setup"
                          items={movementInfo.cues.setup}
                          tone="neutral"
                        />
                      )}
                    {movementInfo.cues.dos &&
                      movementInfo.cues.dos.length > 0 && (
                        <CueList
                          title="Haz esto"
                          items={movementInfo.cues.dos}
                          tone="ok"
                        />
                      )}
                    {movementInfo.cues.donts &&
                      movementInfo.cues.donts.length > 0 && (
                        <CueList
                          title="No hagas esto"
                          items={movementInfo.cues.donts}
                          tone="bad"
                        />
                      )}
                  </div>
                </AnimatedItem>
              </AnimatedSection>
            )}

          {/* COMMON MISTAKES */}
          {movementInfo?.commonMistakes &&
            movementInfo.commonMistakes.length > 0 && (
              <AnimatedSection>
                <AnimatedItem>
                  <div
                    data-testid="movement-mistakes"
                    style={{
                      padding: 16,
                      background: "var(--k-surface)",
                      border: "1px solid var(--k-line)",
                      borderRadius: 16,
                    }}
                  >
                    {/* Neutral: a list of common mistakes is coaching content,
                        not a warning state (audit 2026-09-15, S2). */}
                    <p
                      className="k-eyebrow"
                      style={{
                        color: "var(--k-t3)",
                        margin: "0 0 12px",
                      }}
                    >
                      Errores comunes
                    </p>
                    <div style={{ display: "grid", gap: 10 }}>
                      {movementInfo.commonMistakes.map((m, i) => (
                        <div
                          key={i}
                          style={{
                            background: "var(--k-elevated)",
                            border: "1px solid var(--k-line)",
                            borderRadius: 12,
                            padding: "10px 12px",
                          }}
                        >
                          <div style={{ display: "flex", gap: 10 }}>
                            <WarningGlyph />
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontFamily: "var(--k-font-body)",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "var(--k-t1)",
                                  marginBottom: 2,
                                }}
                              >
                                {m.title}
                              </div>
                              {m.description && (
                                <div
                                  style={{
                                    fontFamily: "var(--k-font-body)",
                                    fontSize: 12,
                                    color: "var(--k-t2)",
                                    marginBottom: 6,
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {m.description}
                                </div>
                              )}
                              {m.fixCue && (
                                <div
                                  style={{
                                    fontFamily: "var(--k-font-mono)",
                                    fontSize: 11,
                                    color: "var(--k-t2)",
                                    background: "var(--k-elevated)",
                                    border: "1px solid var(--k-line)",
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    display: "inline-block",
                                  }}
                                >
                                  CUE: {m.fixCue}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimatedItem>
              </AnimatedSection>
            )}

          {/* PROGRESSIONS */}
          {movementInfo?.progressions &&
            movementInfo.progressions.length > 0 && (
              <AnimatedSection>
                <AnimatedItem>
                  <div
                    data-testid="movement-progressions"
                    style={{
                      padding: 16,
                      background: "var(--k-surface)",
                      border: "1px solid var(--k-line)",
                      borderRadius: 16,
                    }}
                  >
                    <p
                      className="k-eyebrow"
                      style={{ color: "var(--k-t3)", margin: "0 0 12px" }}
                    >
                      Escalados / progresiones
                    </p>
                    <div style={{ display: "grid", gap: 8 }}>
                      {movementInfo.progressions.map((p, i) => (
                        <div
                          key={i}
                          style={{
                            background: "var(--k-elevated)",
                            border: "1px solid var(--k-line)",
                            borderRadius: 12,
                            padding: "10px 12px",
                            display: "flex",
                            gap: 10,
                            alignItems: "flex-start",
                          }}
                        >
                          {/* Difficulty is not a warning: outline chips in the
                              neutral ramp, never orange/red (audit S2). */}
                          <span
                            className="k-mono"
                            style={{
                              fontSize: 9,
                              letterSpacing: 1.2,
                              padding: "3px 6px",
                              borderRadius: 4,
                              border: "1px solid var(--k-line-2)",
                              color: "var(--k-t3)",
                            }}
                          >
                            {p.level === "beginner"
                              ? "PRINCIPIANTE"
                              : p.level === "intermediate"
                                ? "INTERMEDIO"
                                : "AVANZADO"}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontFamily: "var(--k-font-body)",
                                fontSize: 13,
                                fontWeight: 600,
                                color: "var(--k-t1)",
                              }}
                            >
                              {p.name}
                            </div>
                            {p.description && (
                              <div
                                style={{
                                  fontFamily: "var(--k-font-body)",
                                  fontSize: 12,
                                  color: "var(--k-t2)",
                                  marginTop: 2,
                                }}
                              >
                                {p.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimatedItem>
              </AnimatedSection>
            )}

          {/* MUSCLES WORKED */}
          {movementInfo?.musclesWorked &&
            movementInfo.musclesWorked.length > 0 && (
              <AnimatedSection>
                <AnimatedItem>
                  <div
                    data-testid="movement-muscles"
                    style={{
                      padding: 16,
                      background: "var(--k-surface)",
                      border: "1px solid var(--k-line)",
                      borderRadius: 16,
                    }}
                  >
                    <p
                      className="k-eyebrow"
                      style={{ color: "var(--k-t3)", margin: "0 0 10px" }}
                    >
                      Músculos trabajados
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {movementInfo.musclesWorked.map((m) => (
                        <span
                          key={m}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: "var(--k-elevated)",
                            border: "1px solid var(--k-line)",
                            color: "var(--k-t2)",
                            fontFamily: "var(--k-font-body)",
                            fontSize: 11,
                            textTransform: "capitalize",
                          }}
                        >
                          {muscleLabel(m)}
                        </span>
                      ))}
                    </div>
                  </div>
                </AnimatedItem>
              </AnimatedSection>
            )}
        </div>

        {/* Right column — stats + chart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats Grid V3 */}
          {/* Zero states shrink instead of printing nonsense: the audit found
              "– PR ACTUAL · 0% PERCENTIL · #0 RANK DE 3 · 1 ENTRENOS 90D".
              A tile only renders once its number means something. */}
          {statTiles.length > 0 ? (
            <AnimatedSection className="grid grid-cols-2 gap-2">
              {statTiles.map((tile) => (
                <AnimatedItem key={tile.label}>
                  <V3StatCard
                    value={tile.value}
                    label={tile.label}
                    accent={tile.accent}
                  />
                </AnimatedItem>
              ))}
            </AnimatedSection>
          ) : (
            <div
              style={{
                padding: 14,
                borderRadius: 14,
                background: "var(--k-surface)",
                border: "1px solid var(--k-line)",
                fontFamily: "var(--k-font-body)",
                fontSize: 12,
                color: "var(--k-t2)",
                lineHeight: 1.4,
              }}
            >
              Aún no tienes marcas en este movimiento. Regístralo en tu próximo
              WOD y aquí verás tu PR, tu frecuencia y tu lugar en el box.
            </div>
          )}

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
            href={`/atleta/wod` as Route}
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
            <Link
              href={`/atleta/wod` as Route}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: "var(--k-surface)",
                  border: "1px solid var(--k-line)",
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
                      color: "var(--k-t2)",
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
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    Vamos
                    <ArrowRight size={13} aria-hidden />
                  </span>
                </span>
              </div>
            </Link>
          </AnimatedItem>
        </AnimatedSection>
      )}
    </div>
  );
}

function CueList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "ok" | "bad" | "neutral";
}) {
  const color =
    tone === "ok"
      ? "var(--k-t2)"
      : tone === "bad"
        ? "var(--k-danger)"
        : "var(--k-t2)";
  return (
    <div>
      <p
        className="k-mono"
        style={{
          fontSize: 9,
          letterSpacing: 1.5,
          color,
          margin: "0 0 6px",
        }}
      >
        {title.toUpperCase()}
      </p>
      <ul
        style={{
          display: "grid",
          gap: 6,
          margin: 0,
          padding: 0,
          listStyle: "none",
        }}
      >
        {items.map((it, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              fontFamily: "var(--k-font-body)",
              fontSize: 13,
              color: "var(--k-t1)",
              lineHeight: 1.4,
            }}
          >
            <CueGlyph tone={tone} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CueGlyph({ tone }: { tone: "ok" | "bad" | "neutral" }) {
  const color =
    tone === "ok"
      ? "var(--k-t2)"
      : tone === "bad"
        ? "var(--k-danger)"
        : "var(--k-t3)";
  if (tone === "bad") {
    return (
      <svg
        width={16}
        height={16}
        viewBox="0 0 16 16"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        style={{ flexShrink: 0, marginTop: 3 }}
      >
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
    );
  }
  if (tone === "ok") {
    return (
      <svg
        width={16}
        height={16}
        viewBox="0 0 16 16"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, marginTop: 3 }}
      >
        <path d="M3 8l3 3 7-7" />
      </svg>
    );
  }
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill={color}
      style={{ flexShrink: 0, marginTop: 5 }}
    >
      <circle cx="8" cy="8" r="3" />
    </svg>
  );
}

function WarningGlyph() {
  // Neutral tone: this marks coaching content, not an error condition.
  return (
    <TriangleAlert
      size={20}
      strokeWidth={2}
      color="var(--k-t3)"
      aria-hidden
      style={{ flexShrink: 0, marginTop: 1 }}
    />
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
          color: accent ? "var(--k-t2)" : "var(--k-t1)",
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
