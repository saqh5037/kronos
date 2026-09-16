import type { Route } from "next";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import { generateGoalPlan } from "@/server/actions/ai";
import { listMyGoals } from "@/server/actions/goals";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import {
  goalMetricLabel,
  formatDeadline,
  normalizeGoalId,
  pickDefaultGoal,
  currentPlanWeek,
  planSessionTypeLabel,
} from "./_helpers";

export const metadata = { title: "Kronos — Plan IA" };
export const dynamic = "force-dynamic";

/**
 * Audit 2026-09-15 (P1 hierarchy, /atleta/plan): "a picker pretending to be a
 * plan". The athlete had an AI plan and the page showed "Elige el objetivo para
 * el que quieres generar un plan" over 70 % empty space at 360.
 *
 * The page now opens on the athlete's plan for the goal with the nearest
 * deadline — current week and next session first — and the goal picker becomes
 * a secondary list underneath. It only falls back to the picker when there is
 * no active goal to plan for.
 */

// ─── Shared styles ────────────────────────────────────────────────────────────

const eyebrowStyle: React.CSSProperties = {
  fontFamily: "var(--k-font-display)",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.2em",
  color: "var(--k-t3)",
  textTransform: "uppercase",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    // 56px clears the 40px hamburger pinned at top:12 (see atleta/layout).
    <header style={{ padding: "56px 20px 16px" }}>
      <div style={{ marginBottom: 4 }}>
        <AthleteBackLink href="/atleta/perfil" label="Mi perfil" />
      </div>
      <span style={eyebrowStyle}>{eyebrow}</span>
      <h1
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          textTransform: "uppercase",
          color: "var(--k-t1)",
          margin: "6px 0 0",
        }}
      >
        {title}
      </h1>
    </header>
  );
}

function EmptyCard({
  message,
  ctaHref,
  ctaLabel,
}: {
  message: string;
  ctaHref: Route;
  ctaLabel: string;
}) {
  return (
    <div
      style={{
        margin: "0 20px",
        padding: 24,
        background: "var(--k-surface)",
        border: "1px solid var(--k-line)",
        borderRadius: 16,
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: 13,
          color: "var(--k-t2)",
          fontFamily: "var(--k-font-body)",
          margin: "0 0 14px",
        }}
      >
        {message}
      </p>
      <Link
        href={ctaHref}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 44,
          padding: "10px 16px",
          borderRadius: 10,
          background: "transparent",
          border: "1px solid var(--k-line-2)",
          color: "var(--k-t2)",
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          textDecoration: "none",
        }}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

type GoalRow = Awaited<ReturnType<typeof listMyGoals>>[number];

/** Secondary list: switch the plan to another active goal. */
function GoalPicker({
  goals,
  currentGoalId,
  now,
}: {
  goals: GoalRow[];
  currentGoalId: string | null;
  now: Date;
}) {
  const others = goals.filter(
    (g) => g.status === "ACTIVE" && g.id !== currentGoalId,
  );
  if (others.length === 0) return null;

  return (
    <AnimatedSection>
      <AnimatedItem>
        <p style={{ ...eyebrowStyle, marginTop: 28, marginBottom: 10 }}>
          Otros objetivos
        </p>
      </AnimatedItem>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {others.map((g) => (
          <AnimatedItem key={g.id}>
            <Link
              href={`/atleta/plan?goalId=${g.id}` as Route}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  padding: 16,
                  minHeight: 64,
                  background: "var(--k-surface)",
                  border: "1px solid var(--k-line)",
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontWeight: 700,
                      fontSize: 15,
                      color: "var(--k-t1)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {g.movementName ?? goalMetricLabel(g.metric)}{" "}
                    <span style={{ color: "var(--k-accent)" }}>
                      {g.targetValue} {g.unit}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--k-font-body)",
                      fontSize: 11,
                      marginTop: 4,
                      color: "var(--k-t3)",
                    }}
                  >
                    {formatDeadline(g.deadline, now)}
                  </div>
                </div>
                <ChevronRight
                  width={16}
                  height={16}
                  aria-hidden
                  style={{ color: "var(--k-t3)", flexShrink: 0 }}
                />
              </div>
            </Link>
          </AnimatedItem>
        ))}
      </div>
    </AnimatedSection>
  );
}

// ─── Plan view ────────────────────────────────────────────────────────────────

async function PlanView({
  goalId,
  allGoals,
}: {
  goalId: string;
  allGoals: GoalRow[];
}) {
  const result = await generateGoalPlan(goalId);

  if (!result) {
    return (
      <div className="pb-28">
        <PageHeader eyebrow="KRONOS AI · PLAN" title="Plan personalizado" />
        <EmptyCard
          message="No encontramos ese objetivo o no te pertenece."
          ctaHref="/atleta/perfil"
          ctaLabel="Ir a mi perfil"
        />
      </div>
    );
  }

  const { plan, goal } = result;
  const isAI = plan.source === "ai";
  const now = new Date();
  const deadlineLabel = formatDeadline(goal.deadline, now);

  // "Current week" is derived from the time left until the deadline, not from
  // the accordion's first item: the athlete needs to know which week they
  // are IN.
  const weekNumber = currentPlanWeek(plan.weeks.length, goal.deadline, now);
  const currentWeek =
    plan.weeks.find((w) => w.weekNumber === weekNumber) ?? plan.weeks[0];
  const nextSession = currentWeek?.sessions[0] ?? null;

  return (
    <div style={{ padding: "56px 16px 96px" }}>
      {/* Hero */}
      <AnimatedSection>
        <AnimatedItem>
          <AthleteBackLink href="/atleta/perfil" label="Mi perfil" />
        </AnimatedItem>
        <AnimatedItem>
          <div style={{ marginTop: 12 }}>
            <span style={eyebrowStyle}>KRONOS AI · PLAN PERSONALIZADO</span>
          </div>
        </AnimatedItem>
        <AnimatedItem>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "var(--k-accent)",
                textTransform: "uppercase",
              }}
            >
              Tu objetivo
            </span>
            <h1
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 36,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--k-t1)",
                margin: 0,
                lineHeight: 1.05,
              }}
            >
              {goal.movementName ?? goalMetricLabel(goal.metric)}{" "}
              <span style={{ color: "var(--k-accent)" }}>
                {goal.targetValue} {goal.unit}
              </span>
            </h1>
          </div>
          <p
            style={{
              fontSize: 12,
              marginTop: 12,
              color: "var(--k-t2)",
              fontFamily: "var(--k-font-body)",
            }}
          >
            {deadlineLabel} · {plan.weeks.length} semanas
          </p>
        </AnimatedItem>
      </AnimatedSection>

      {/* Esta semana + próxima sesión — lo primero accionable */}
      {currentWeek && (
        <AnimatedSection>
          <AnimatedItem>
            <div
              style={{
                marginTop: 20,
                padding: 18,
                background: "var(--k-surface)",
                border: "1px solid var(--k-accent-line)",
                borderRadius: 16,
                boxShadow: "var(--k-accent-glow)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    ...eyebrowStyle,
                    color: "var(--k-accent)",
                  }}
                >
                  Semana {currentWeek.weekNumber} de {plan.weeks.length}
                </span>
                <span
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--k-t3)",
                  }}
                >
                  {currentWeek.sessions.length} sesiones
                </span>
              </div>
              <div
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "var(--k-t1)",
                }}
              >
                {currentWeek.focus}
              </div>
              {nextSession && (
                <div
                  style={{
                    paddingTop: 12,
                    borderTop: "1px solid var(--k-line)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <span style={eyebrowStyle}>Tu próxima sesión</span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--k-font-display)",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--k-t2)",
                      }}
                    >
                      {nextSession.day}
                    </span>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontFamily: "var(--k-font-display)",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--k-accent)",
                        background: "var(--k-accent-soft)",
                        border: "1px solid var(--k-accent-line)",
                      }}
                    >
                      {planSessionTypeLabel(nextSession.type)}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "var(--k-font-body)",
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: "var(--k-t1)",
                    }}
                  >
                    {nextSession.description}
                  </p>
                </div>
              )}
            </div>
          </AnimatedItem>
        </AnimatedSection>
      )}

      <AnimatedSection>
        {/* Overview card */}
        <AnimatedItem>
          <div
            style={{
              marginTop: 16,
              padding: 18,
              background: "var(--k-surface)",
              border: "1px solid var(--k-line)",
              borderRadius: 16,
            }}
          >
            <span style={eyebrowStyle}>Estrategia</span>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                marginTop: 8,
                fontWeight: 500,
                color: "var(--k-t1)",
                fontFamily: "var(--k-font-body)",
                marginBottom: 0,
              }}
            >
              {plan.overview}
            </p>
          </div>
        </AnimatedItem>

        {/* Week accordion */}
        <div
          style={{
            marginTop: 20,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {plan.weeks.map((w) => (
            <AnimatedItem key={w.weekNumber}>
              <details
                open={w.weekNumber === weekNumber}
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "var(--k-surface)",
                  border: `1px solid ${
                    w.weekNumber === weekNumber
                      ? "var(--k-accent-line)"
                      : "var(--k-line)"
                  }`,
                }}
              >
                <summary
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: 16,
                    minHeight: 64,
                    cursor: "pointer",
                    listStyle: "none",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontWeight: 700,
                      fontSize: 28,
                      width: 48,
                      textAlign: "center",
                      lineHeight: 1,
                      color:
                        w.weekNumber === weekNumber
                          ? "var(--k-accent)"
                          : "var(--k-t2)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {w.weekNumber}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--k-font-display)",
                        fontWeight: 700,
                        fontSize: 15,
                        letterSpacing: "-0.01em",
                        color: "var(--k-t1)",
                      }}
                    >
                      Semana {w.weekNumber}
                      {w.weekNumber === weekNumber ? " · en curso" : ""}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--k-font-display)",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        marginTop: 4,
                        textTransform: "uppercase",
                        color: "var(--k-t2)",
                      }}
                    >
                      {w.focus} · {w.sessions.length} sesiones
                    </div>
                  </div>
                  <ChevronRight
                    width={16}
                    height={16}
                    aria-hidden
                    style={{ color: "var(--k-t3)", flexShrink: 0 }}
                  />
                </summary>
                <div
                  style={{
                    padding: "8px 16px 16px",
                    borderTop: "1px solid var(--k-line)",
                  }}
                >
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: "8px 0 0",
                      // One grid for the whole list instead of one per row, so
                      // the chip column is as wide as the WIDEST chip and every
                      // description starts on the same line. With a hard 80px
                      // column "Recuperación" ran straight into the text next
                      // to it; `max-content` cannot overflow by construction.
                      display: "grid",
                      gridTemplateColumns: "40px max-content 1fr",
                      gap: "8px 12px",
                      alignItems: "baseline",
                    }}
                  >
                    {w.sessions.map((s, i) => (
                      <li
                        key={i}
                        // `contents` promotes the three spans into the list's
                        // own grid so all rows share its columns.
                        style={{
                          display: "contents",
                          fontSize: 13,
                          fontFamily: "var(--k-font-body)",
                          color: "var(--k-t1)",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--k-font-display)",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            fontSize: 11,
                            color: "var(--k-t3)",
                          }}
                        >
                          {s.day}
                        </span>
                        <span
                          style={{
                            display: "inline-block",
                            textAlign: "center",
                            whiteSpace: "nowrap",
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontFamily: "var(--k-font-display)",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "var(--k-accent)",
                            background: "var(--k-accent-soft)",
                            border: "1px solid var(--k-accent-line)",
                          }}
                        >
                          {planSessionTypeLabel(s.type)}
                        </span>
                        <span
                          style={{
                            color: "var(--k-t1)",
                            fontSize: 13,
                            fontFamily: "var(--k-font-body)",
                          }}
                        >
                          {s.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {w.notes && (
                    <p
                      style={{
                        marginTop: 14,
                        fontSize: 12,
                        lineHeight: 1.5,
                        fontStyle: "italic",
                        paddingLeft: 12,
                        borderLeft: "2px solid var(--k-accent)",
                        color: "var(--k-t2)",
                        fontFamily: "var(--k-font-body)",
                      }}
                    >
                      {w.notes}
                    </p>
                  )}
                </div>
              </details>
            </AnimatedItem>
          ))}
        </div>

        {/* Otros objetivos — el picker, ahora secundario */}
        <GoalPicker goals={allGoals} currentGoalId={goal.id} now={now} />

        {/* Disclaimer */}
        <AnimatedItem>
          <div
            style={{
              marginTop: 24,
              borderTop: "1px solid var(--k-line)",
              paddingTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "center",
            }}
          >
            {isAI && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "var(--k-font-display)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--k-accent)",
                }}
              >
                <Sparkles width={11} height={11} aria-hidden />
                Kronos AI
              </span>
            )}
            <p
              style={{
                fontSize: 11,
                lineHeight: 1.6,
                textAlign: "center",
                padding: "0 16px",
                fontStyle: "italic",
                color: "var(--k-t3)",
                fontFamily: "var(--k-font-body)",
                margin: 0,
              }}
            >
              Plan generado a partir de tu historial. Es una guía — adáptalo con
              tu coach según fatiga, lesiones y disponibilidad. No reemplaza la
              programación oficial del box.
            </p>
          </div>
        </AnimatedItem>
      </AnimatedSection>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AtletaPlanPage(props: {
  searchParams: Promise<{ goalId?: string }>;
}) {
  const params = await props.searchParams;
  const requestedGoalId = normalizeGoalId(params.goalId);

  let goals: GoalRow[] = [];
  try {
    goals = await listMyGoals();
  } catch {
    goals = [];
  }

  // No goalId in the URL → open on the goal with the nearest deadline instead
  // of showing a picker over an empty screen.
  const goalId = requestedGoalId ?? pickDefaultGoal(goals)?.id ?? null;

  if (!goalId) {
    return (
      <div className="pb-28">
        <PageHeader eyebrow="KRONOS AI · PLAN" title="Plan personalizado" />
        <EmptyCard
          message="Aún no tienes objetivos activos. Crea uno en tu perfil para que la IA genere tu plan."
          ctaHref={"/atleta/perfil" as Route}
          ctaLabel="Ir a mi perfil"
        />
      </div>
    );
  }

  return <PlanView goalId={goalId} allGoals={goals} />;
}
