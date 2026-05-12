import Link from "next/link";
import type { Route } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db as prismaBase } from "@/server/db";
import { isPersonalBoxSlug } from "@/lib/personal-box";
import { readPrefs } from "@/lib/atleta-prefs";
import { levelToTier } from "@/lib/skills/progress";
import {
  getAthleteHome,
  getMyAttendanceLast90d,
  getMyScoresTimeline,
  type AthleteHome,
  type MyAttendanceDay,
  type MyScoreTimelinePoint,
} from "@/server/actions/athlete-home";
import { listMyPRs, type PRRow } from "@/server/actions/prs";
import {
  getMyCapabilityProfile,
  type CapabilityProfile,
} from "@/server/analytics/capability";
import { listMyBodyMetrics } from "@/server/actions/body-metrics";
import {
  listMyMovementsRated,
  type RankedMovement,
} from "@/server/analytics/movement";
import { formatDayMonth } from "@/lib/week";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import KCard from "@/components/kronos/KCard";
import { MyHeatmap90d } from "./_components/MyHeatmap90d";
import { ScoresTimeline } from "./_components/ScoresTimeline";
import { CapabilityRadar } from "@/components/charts/CapabilityRadar";
import BodyMetricSection from "@/components/atleta/BodyMetricSection";
import { getMyCoachCards } from "@/server/actions/coach-cards";
import CoachCardsSection from "@/components/atleta/CoachCardsSection";

export const metadata = { title: "Kronos — Perfil" };

const TIER_LABEL: Record<string, { label: string; bg: string; color: string }> =
  {
    principiante: {
      label: "PRINCIPIANTE",
      bg: "var(--k-elevated)",
      color: "var(--k-t2)",
    },
    escalado: {
      label: "ESCALADO",
      bg: "var(--k-accent-soft)",
      color: "var(--k-accent)",
    },
    rx: {
      label: "RX",
      bg: "var(--k-accent-soft)",
      color: "var(--k-accent)",
    },
  };

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);

  let home: AthleteHome = null;
  let prs: PRRow[] = [];
  let attendance90d: MyAttendanceDay[] = [];
  let scoresTimeline: MyScoreTimelinePoint[] = [];
  let capability: CapabilityProfile | null = null;
  let bodyMetrics: Awaited<ReturnType<typeof listMyBodyMetrics>> = [];
  let topMovements: RankedMovement[] = [];
  let coachCards: Awaited<ReturnType<typeof getMyCoachCards>> = [];

  try {
    [
      home,
      prs,
      attendance90d,
      scoresTimeline,
      bodyMetrics,
      topMovements,
      coachCards,
    ] = await Promise.all([
      getAthleteHome(),
      listMyPRs(),
      getMyAttendanceLast90d(),
      getMyScoresTimeline(90),
      listMyBodyMetrics({ limit: 60 }),
      listMyMovementsRated(6).catch(() => []),
      getMyCoachCards().catch(() => []),
    ]);
    capability = await getMyCapabilityProfile().catch(() => null);
  } catch {
    // Sesión ausente
  }

  let athleteTier: ReturnType<typeof levelToTier> = "principiante";
  let isPersonalBox = false;
  let configPhotoUrl: string | null = null;
  let weightUnit: "kg" | "lb" = "kg";
  let activeSinceISO: string | null = null;

  try {
    if (session?.user?.tenantId && session.user.id) {
      const [box, athlete] = await Promise.all([
        prismaBase.box.findUnique({
          where: { id: session.user.tenantId },
          select: { slug: true },
        }),
        prismaBase.athlete.findFirst({
          where: { tenantId: session.user.tenantId, userId: session.user.id },
          select: { tags: true, photoUrl: true, createdAt: true },
        }),
      ]);
      if (box) isPersonalBox = isPersonalBoxSlug(box.slug);
      if (athlete) {
        const prefs = readPrefs(athlete.tags);
        athleteTier = levelToTier(prefs.level);
        weightUnit = prefs.unit ?? "kg";
        configPhotoUrl = athlete.photoUrl;
        activeSinceISO = athlete.createdAt.toISOString();
      }
    }
  } catch {
    // best effort
  }

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
  const tierCfg = TIER_LABEL[athleteTier]!;
  const activeSinceLabel = activeSinceISO
    ? formatActiveSince(new Date(activeSinceISO))
    : null;

  return (
    <div className="pb-28 relative">
      {/* ── 1. HERO ── */}
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
            <div className="relative shrink-0">
              {configPhotoUrl ? (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "1.5px solid var(--k-accent)",
                    boxShadow: "var(--k-accent-glow)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={configPhotoUrl}
                    alt={home.athlete.firstName}
                    width={72}
                    height={72}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "var(--k-elevated)",
                    border: "1.5px solid var(--k-accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--k-font-display)",
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "var(--k-accent)",
                    boxShadow: "var(--k-accent-glow)",
                  }}
                >
                  {initials}
                </div>
              )}
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
              <div
                className="mt-1.5"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "var(--k-font-display)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    color: tierCfg.color,
                    background: tierCfg.bg,
                    border: `1px solid currentColor`,
                    padding: "3px 8px",
                    borderRadius: 999,
                  }}
                >
                  {tierCfg.label}
                </span>
                {activeSinceLabel && (
                  <span
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      color: "var(--k-t3)",
                      textTransform: "uppercase",
                    }}
                  >
                    {activeSinceLabel}
                  </span>
                )}
                <span
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    color: "var(--k-t3)",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: "var(--k-elevated)",
                    border: "1px solid var(--k-line)",
                  }}
                  title="Sincronización con Apple Health / Google Fit en V5"
                >
                  ⌚ Wearable: próximamente
                </span>
              </div>
            </div>
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

      {coachCards.length > 0 && (
        <div className="px-3.5 mb-4">
          <CoachCardsSection cards={coachCards} />
        </div>
      )}

      {/* ── 2. CAPABILITY RADAR ── */}
      {capability && capability.categories.length > 0 && (
        <AnimatedSection className="px-3.5 mb-4">
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

      {/* ── 3. PRs TOP-6 ── */}
      {prs.length > 0 && (
        <AnimatedSection className="mb-4">
          <div className="flex items-baseline justify-between px-[18px] pb-2">
            <span className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
              RECORDS PERSONALES
            </span>
            <span
              className="font-mono text-[10px] font-bold tracking-[0.08em]"
              style={{ color: "var(--k-t3)" }}
            >
              TOP {Math.min(prs.length, 6)}
            </span>
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
                          color: i === 0 ? "var(--k-accent)" : "var(--k-t1)",
                          textShadow:
                            i === 0
                              ? "0 0 10px rgba(200, 255, 45, 0.3)"
                              : "none",
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

      {/* ── 4. HISTÓRICO (timeline + heatmap unificados) ── */}
      <AnimatedSection className="px-3.5 mb-4">
        <AnimatedItem>
          <KCard>
            <div className="p-4">
              <p className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
                HISTÓRICO · ÚLTIMOS 90 DÍAS
              </p>
              {scoresTimeline.length >= 2 ? (
                <>
                  <ScoresTimeline data={scoresTimeline} />
                  <p
                    className="mt-2 text-[10px]"
                    style={{ color: "var(--k-t3)" }}
                  >
                    Valores normalizados 0–100 para comparar entre WODs.
                  </p>
                </>
              ) : (
                <p
                  className="text-sm"
                  style={{ color: "var(--k-t2)", margin: 0 }}
                >
                  Necesitas al menos 2 scores para ver tu progresión.
                </p>
              )}
              {attendance90d.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      className="k-eyebrow"
                      style={{ color: "var(--k-t2)" }}
                    >
                      ASISTENCIA
                    </span>
                    <span
                      className="font-mono text-[10px] font-bold"
                      style={{ color: "var(--k-accent)" }}
                    >
                      {attendance90d.length} clases
                    </span>
                  </div>
                  <MyHeatmap90d days={attendance90d} />
                </div>
              )}
            </div>
          </KCard>
        </AnimatedItem>
      </AnimatedSection>

      {/* ── 5. CUERPO ── */}
      <AnimatedSection className="px-3.5 mb-4">
        <AnimatedItem>
          <KCard>
            <div className="p-4">
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <span className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
                  CUERPO
                </span>
                <span
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "var(--k-t3)",
                  }}
                >
                  COMPOSICIÓN
                </span>
              </div>
              <BodyMetricSection
                initial={bodyMetrics}
                defaultUnit={weightUnit}
              />
            </div>
          </KCard>
        </AnimatedItem>
      </AnimatedSection>

      {/* ── MIS MOVIMIENTOS · top frecuencia 90d ── */}
      {topMovements.length > 0 && (
        <AnimatedSection className="mb-4">
          <div className="flex items-baseline justify-between px-[18px] pb-2">
            <span className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
              MIS MOVIMIENTOS
            </span>
            <Link
              href={"/atleta/movimientos" as Route}
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--k-accent)",
                textDecoration: "none",
              }}
            >
              Ver todos →
            </Link>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              padding: "4px 14px 8px",
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
            }}
          >
            {topMovements.map((m) => (
              <AnimatedItem key={m.movementId}>
                <Link
                  href={`/atleta/movimientos/${m.movementId}` as Route}
                  className="k-tap"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    minWidth: 132,
                    padding: "12px 14px",
                    background: "var(--k-surface)",
                    border: m.isStale
                      ? "1px solid var(--k-warning)"
                      : "1px solid var(--k-line)",
                    borderRadius: 12,
                    textDecoration: "none",
                    color: "inherit",
                    scrollSnapAlign: "start",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--k-font-body)",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--k-t1)",
                      lineHeight: 1.25,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      minHeight: 30,
                    }}
                  >
                    {m.movementName}
                  </span>
                  <div
                    style={{ display: "flex", alignItems: "baseline", gap: 4 }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--k-font-display)",
                        fontSize: 18,
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        color: "var(--k-accent)",
                      }}
                    >
                      {m.frequency90d}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--k-font-display)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        color: "var(--k-t3)",
                        textTransform: "uppercase",
                      }}
                    >
                      {m.frequency90d === 1 ? "vez · 90d" : "veces · 90d"}
                    </span>
                  </div>
                  {m.isStale && (
                    <span
                      style={{
                        fontFamily: "var(--k-font-display)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--k-warning)",
                      }}
                    >
                      Hace +30d
                    </span>
                  )}
                </Link>
              </AnimatedItem>
            ))}
          </div>
        </AnimatedSection>
      )}

      {/* Acceso secundario a Logros */}
      <AnimatedSection className="px-3.5">
        <AnimatedItem>
          <Link
            href={"/atleta/logros" as Route}
            className="k-tap"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              background: "var(--k-surface)",
              border: "1px solid var(--k-accent-line)",
              borderRadius: 14,
              boxShadow: "var(--k-accent-glow)",
              textDecoration: "none",
              color: "var(--k-t1)",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "var(--k-accent-soft)",
                display: "grid",
                placeItems: "center",
                color: "var(--k-accent)",
              }}
            >
              ★
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                Tu colección
              </div>
              <div
                style={{
                  fontFamily: "var(--k-font-body)",
                  fontSize: 11,
                  color: "var(--k-t3)",
                  marginTop: 2,
                }}
              >
                Logros · XP · niveles
              </div>
            </div>
            <span style={{ color: "var(--k-t3)", fontSize: 18 }}>›</span>
          </Link>
        </AnimatedItem>
      </AnimatedSection>

      {/* Acceso rápido a páginas huérfanas */}
      <AnimatedSection className="px-3.5 mt-3">
        <AnimatedItem>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
            }}
          >
            <ProfileQuickLink
              href="/atleta/historial"
              icon="📊"
              label="Historial"
            />
            <ProfileQuickLink
              href="/atleta/leaderboard"
              icon="🏆"
              label="Leaderboard"
            />
            <ProfileQuickLink href="/atleta/pagos" icon="💳" label="Pagos" />
          </div>
        </AnimatedItem>
      </AnimatedSection>

      {/* Box Personal helper si aplica */}
      {isPersonalBox && (
        <div
          className="px-3.5 mt-3"
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 11,
            color: "var(--k-t3)",
            textAlign: "center",
          }}
        >
          Estás entrenando en modo personal.
        </div>
      )}
    </div>
  );
}

function ProfileQuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href as Route}
      className="k-tap"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "14px 8px",
        background: "var(--k-surface)",
        border: "1px solid var(--k-line)",
        borderRadius: 14,
        textDecoration: "none",
        color: "var(--k-t1)",
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--k-t2)",
          textAlign: "center",
        }}
      >
        {label}
      </span>
    </Link>
  );
}

function formatActiveSince(date: Date): string {
  const now = new Date();
  const months = Math.max(
    0,
    (now.getFullYear() - date.getFullYear()) * 12 +
      (now.getMonth() - date.getMonth()),
  );
  if (months < 1) return "DESDE HOY";
  if (months === 1) return "1 MES ACTIVO";
  if (months < 12) return `${months} MESES ACTIVO`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 AÑO ACTIVO" : `${years} AÑOS ACTIVO`;
}
