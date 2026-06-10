import type { Route } from "next";
import Link from "next/link";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import { generateGoalPlan } from "@/server/actions/ai";
import { listMyGoals } from "@/server/actions/goals";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import { goalMetricLabel, formatDeadline, normalizeGoalId } from "./_helpers";

export const metadata = { title: "Kronos — Plan IA" };
export const dynamic = "force-dynamic";

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

function PageHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <header style={{ padding: "48px 20px 16px" }}>
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

function EmptyCard({ message, ctaHref, ctaLabel }: { message: string; ctaHref: Route; ctaLabel: string }) {
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
          display: "inline-block",
          padding: "8px 14px",
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

// ─── Goal selector (shown when no goalId in URL) ──────────────────────────────

async function GoalSelector() {
  const goals = await listMyGoals();
  const active = goals.filter((g) => g.status === "ACTIVE");

  return (
    <div className="pb-28">
      <PageHeader eyebrow="KRONOS AI · PLAN" title="Plan personalizado" />
      <div style={{ padding: "0 20px" }}>
        {active.length === 0 ? (
          <EmptyCard
            message="Aún no tienes objetivos activos. Crea uno en tu perfil para que la IA genere tu plan."
            ctaHref={"/atleta/perfil" as Route}
            ctaLabel="Ir a mi perfil"
          />
        ) : (
          <AnimatedSection>
            <AnimatedItem>
              <p
                style={{
                  fontFamily: "var(--k-font-body)",
                  fontSize: 13,
                  color: "var(--k-t2)",
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}
              >
                Elige el objetivo para el que quieres generar un plan:
              </p>
            </AnimatedItem>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {active.map((g) => (
                <AnimatedItem key={g.id}>
                  <Link
                    href={`/atleta/plan?goalId=${g.id}` as Route}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        padding: 16,
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
                            fontFamily: "var(--k-font-display)",
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: "0.14em",
                            marginTop: 4,
                            textTransform: "uppercase",
                            color: "var(--k-t3)",
                          }}
                        >
                          {formatDeadline(g.deadline)}
                        </div>
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--k-font-display)",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--k-accent)",
                          opacity: 0.7,
                        }}
                      >
                        →
                      </span>
                    </div>
                  </Link>
                </AnimatedItem>
              ))}
            </div>
          </AnimatedSection>
        )}
      </div>
    </div>
  );
}

// ─── Plan view (when goalId is valid) ─────────────────────────────────────────

async function PlanView({ goalId }: { goalId: string }) {
  const result = await generateGoalPlan(goalId);

  if (!result) {
    return (
      <div className="pb-28">
        <PageHeader eyebrow="KRONOS AI · PLAN" title="Plan personalizado" />
        <EmptyCard
          message="No encontramos ese objetivo o no te pertenece."
          ctaHref="/atleta/perfil"
          ctaLabel="← A mi perfil"
        />
      </div>
    );
  }

  const { plan, goal } = result;
  const isAI = plan.source === "ai";
  const fmtDeadline = formatDeadline(goal.deadline);

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
            Para el {fmtDeadline} · {plan.weeks.length} semanas · fuente:{" "}
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 700,
                color: isAI ? "var(--k-accent)" : "var(--k-t3)",
              }}
            >
              {isAI ? "Gemini" : "fallback"}
            </span>
          </p>
        </AnimatedItem>
      </AnimatedSection>

      <AnimatedSection>
        {/* Overview card */}
        <AnimatedItem>
          <div
            style={{
              marginTop: 20,
              padding: 18,
              background: "var(--k-surface)",
              border: "1px solid var(--k-accent-line)",
              borderRadius: 16,
              boxShadow: "0 0 14px rgba(200, 255, 45, 0.08)",
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
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "var(--k-surface)",
                  border: "1px solid var(--k-line)",
                }}
              >
                <summary
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: 16,
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
                      color: "var(--k-accent)",
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
                  <span
                    aria-hidden
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 14,
                      fontWeight: 700,
                      opacity: 0.5,
                      color: "var(--k-t2)",
                    }}
                  >
                    ▾
                  </span>
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
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {w.sessions.map((s, i) => (
                      <li
                        key={i}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "40px 80px 1fr",
                          gap: 12,
                          alignItems: "baseline",
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
                          {s.type}
                        </span>
                        <span style={{ color: "var(--k-t1)" }}>
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

        {/* Disclaimer */}
        <AnimatedItem>
          <div
            style={{
              marginTop: 24,
              borderTop: "1px solid var(--k-line)",
              paddingTop: 16,
            }}
          >
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
  const goalId = normalizeGoalId(params.goalId);

  if (!goalId) {
    return <GoalSelector />;
  }

  return <PlanView goalId={goalId} />;
}
