import Link from "next/link";
import type { Route } from "next";
import { listMyPRs, type PRRow } from "@/server/actions/prs";
import { getDailyGreeting, type DailyGreeting } from "@/server/actions/ai";
import {
  getAthleteHome,
  type AthleteHome,
} from "@/server/actions/athlete-home";
import PersonalizedGreeting from "@/components/atleta/PersonalizedGreeting";
import { StreakHero } from "@/components/atleta/StreakHero";
import KCard from "@/components/kronos/KCard";
import CoachCardsSection from "@/components/atleta/CoachCardsSection";
import { getMyCoachCards } from "@/server/actions/coach-cards";
import {
  listMyScheduledProgramWods,
  type ScheduledProgramWod,
} from "@/server/actions/athlete-program";

/**
 * Home alternativa para atletas en Box Personal (signup independiente sin
 * coach). NO muestra clases, reservas, leaderboards — porque no tienen sentido
 * con un solo atleta. En su lugar:
 *  - Saludo + StreakHero (igual que box real)
 *  - "PRs recientes" (top 3)
 *  - CTAs grandes: loggear WOD del día / subir foto del whiteboard
 */
export default async function PersonalHomeView() {
  let home: AthleteHome = null;
  let prs: PRRow[] = [];
  let greeting: DailyGreeting | null = null;
  let coachCards: Awaited<ReturnType<typeof getMyCoachCards>> = [];
  let programWods: ScheduledProgramWod[] = [];

  try {
    [home, prs, greeting, coachCards, programWods] = await Promise.all([
      getAthleteHome(),
      listMyPRs(),
      getDailyGreeting(),
      getMyCoachCards().catch(() => []),
      listMyScheduledProgramWods().catch(() => []),
    ]);
  } catch {
    // Sesión ausente o atleta sin perfil
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayWod = programWods.find(
    (w) => new Date(w.scheduledFor).toISOString().slice(0, 10) === todayKey,
  );

  if (!home || !home.athlete) {
    return (
      <div style={{ padding: "64px 16px 24px" }}>
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
          MI ENTRENAMIENTO
        </span>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--k-t1)",
            margin: "8px 0 0",
          }}
        >
          ¡Bienvenido!
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--k-t2)",
            marginTop: 16,
          }}
        >
          Empieza a registrar tus WODs y PRs.
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 24,
          }}
        >
          <Link
            href="/atleta/wod/nuevo"
            className="k-btn-grad"
            style={{
              padding: "16px 24px",
              borderRadius: 16,
              fontWeight: 700,
              fontSize: 15,
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            Crear WOD del día →
          </Link>
        </div>
      </div>
    );
  }

  const topPRs = prs.slice(0, 3);

  return (
    <div style={{ padding: "64px 16px 32px" }}>
      <PersonalizedGreeting greeting={greeting} />

      {coachCards.length > 0 && (
        <div style={{ marginTop: 16, marginLeft: -16, marginRight: -16 }}>
          <CoachCardsSection cards={coachCards} />
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <StreakHero count={home.streak} lastEventAt={home.streakLastEventAt} />
      </div>

      {/* WOD del día desde el programa */}
      {todayWod && (
        <div className="px-3.5" style={{ marginTop: 20 }}>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "var(--k-accent)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            TU WOD DE HOY · DEL PROGRAMA
          </div>
          <div
            style={{
              padding: "14px 16px",
              background: "var(--k-surface)",
              border: "1px solid var(--k-accent-line)",
              borderRadius: 14,
              boxShadow: "var(--k-accent-glow)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--k-t1)",
                letterSpacing: "-0.01em",
              }}
            >
              {todayWod.name}
            </div>
            {todayWod.description && (
              <div
                style={{
                  fontFamily: "var(--k-font-body)",
                  fontSize: 12,
                  color: "var(--k-t2)",
                  marginTop: 6,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {todayWod.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTAs principales — el atleta standalone necesita loggear sin clase */}
      <div
        style={{
          marginTop: 20,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <Link
          href="/atleta/wod/nuevo"
          className="k-btn-grad"
          style={{
            padding: "16px 20px",
            borderRadius: 16,
            fontWeight: 700,
            fontSize: 14,
            textAlign: "center",
            textDecoration: "none",
            letterSpacing: "0.01em",
          }}
        >
          Registra tu WOD de hoy →
        </Link>
        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href={"/atleta/programa" as Route}
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: 16,
              fontWeight: 600,
              fontSize: 12,
              textAlign: "center",
              textDecoration: "none",
              background: "var(--k-surface)",
              border: "1px solid var(--k-accent-line)",
              color: "var(--k-accent)",
              letterSpacing: "0.04em",
            }}
          >
            🗓️ Tu programa
          </Link>
          <Link
            href="/atleta/wod/foto"
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: 16,
              fontWeight: 600,
              fontSize: 12,
              textAlign: "center",
              textDecoration: "none",
              background: "var(--k-surface)",
              border: "1px solid var(--k-line-2)",
              color: "var(--k-t1)",
              letterSpacing: "0.04em",
            }}
          >
            📷 Foto whiteboard
          </Link>
        </div>
      </div>

      {/* PRs recientes */}
      {topPRs.length > 0 ? (
        <div style={{ marginTop: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
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
              PRs recientes
            </span>
            <Link
              href="/atleta/perfil"
              style={{
                fontSize: 11,
                color: "var(--k-t2)",
                textDecoration: "none",
              }}
            >
              Ver todos →
            </Link>
          </div>
          <KCard animate={false}>
            <div style={{ padding: 4 }}>
              {topPRs.map((pr, i) => (
                <div
                  key={pr.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderTop: i === 0 ? "none" : "1px solid var(--k-line)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--k-t1)",
                      }}
                    >
                      {pr.movementName}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--k-t3)",
                        marginTop: 2,
                      }}
                    >
                      {new Date(pr.achievedAt).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "var(--k-accent)",
                    }}
                  >
                    {pr.value} {pr.unit}
                  </div>
                </div>
              ))}
            </div>
          </KCard>
        </div>
      ) : (
        <div style={{ marginTop: 32 }}>
          <KCard animate={false}>
            <div style={{ padding: 24, textAlign: "center" }}>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--k-t2)",
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                Todavía no tienes PRs registrados.
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--k-t3)",
                  margin: 0,
                }}
              >
                Registra tu primer WOD para empezar a verlos.
              </p>
            </div>
          </KCard>
        </div>
      )}
    </div>
  );
}
