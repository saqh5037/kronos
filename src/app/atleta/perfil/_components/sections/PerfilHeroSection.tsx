/**
 * PerfilHeroSection — athlete header, racha card and stats grid.
 *
 * getAthleteHomeCached() is deduped across other perfil sections.
 * listMyScores(30) is also fetched here for the SCORES stat card;
 * the actual scores array is passed down so ScoresSection can reuse it
 * — but since sections are independent Suspense islands, ScoresSection
 * fetches it again directly (DB is 26ms, cheaper than over-engineering).
 */

import Link from "next/link";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import { TourTriggerButton } from "@/components/tour/TourTriggerButton";
import { perfilTour } from "@/components/tour/tours/perfil";
import { listMyScores } from "@/server/actions/scores";
import { getAthleteHomeCached } from "../request-cache";

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
        style={{ fontSize: size === "lg" ? 28 : 22, letterSpacing: "-0.02em" }}
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

export async function PerfilHeroSection() {
  const [home, scores] = await Promise.all([
    getAthleteHomeCached(),
    listMyScores(30).catch(() => []),
  ]);

  if (!home || !home.athlete) return null;

  const initials = `${home.athlete.firstName[0]}${home.athlete.lastName ? home.athlete.lastName[0] : ""}`;

  return (
    <>
      <header
        className="relative px-4 pb-4"
        style={{
          paddingTop: "max(calc(env(safe-area-inset-top) + 12px), 48px)",
        }}
      >
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

      {/* Racha hero */}
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

      {/* Stats grid */}
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
    </>
  );
}
