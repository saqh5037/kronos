import Link from "next/link";
import { generateGoalPlan } from "@/server/actions/ai";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";

export const metadata = { title: "Kronos — Plan IA" };

const eyebrowStyle: React.CSSProperties = {
  fontFamily: "var(--k-font-display)",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.2em",
  color: "var(--k-t3)",
  textTransform: "uppercase",
};

const backLinkStyle: React.CSSProperties = {
  fontFamily: "var(--k-font-display)",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--k-t3)",
  textDecoration: "none",
};

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "56px 16px 96px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <span style={eyebrowStyle}>PLAN · ATLETA</span>
      <h1
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "var(--k-t1)",
          margin: 0,
        }}
      >
        Plan personalizado
      </h1>
      <div
        style={{
          marginTop: 12,
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
            margin: 0,
          }}
        >
          {message}
        </p>
        <Link
          href="/atleta/perfil"
          style={{
            marginTop: 14,
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
          ← A perfil
        </Link>
      </div>
    </div>
  );
}

export default async function AtletaPlanPage(props: {
  searchParams: Promise<{ goalId?: string }>;
}) {
  const params = await props.searchParams;
  const goalId = params.goalId;

  if (!goalId) {
    return (
      <EmptyState message="Falta el goal. Volvé a tu perfil y elegí un objetivo activo." />
    );
  }

  const result = await generateGoalPlan(goalId);
  if (!result) {
    return <EmptyState message="No encontramos ese objetivo o no es tuyo." />;
  }

  const { plan, goal } = result;
  const isAI = plan.source === "ai";
  const fmtDeadline = goal.deadline.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ padding: "56px 16px 96px" }}>
      {/* HERO V3 — limpio */}
      <AnimatedSection>
        <AnimatedItem>
          <Link href="/atleta/perfil" style={backLinkStyle}>
            ← Mi perfil
          </Link>
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
              {goal.movementName ?? "objetivo"}{" "}
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
              Plan generado a partir de tu historial. Es una guía — adaptá con
              tu coach según fatiga, lesiones y disponibilidad. No reemplaza la
              programación oficial del box.
            </p>
          </div>
        </AnimatedItem>
      </AnimatedSection>
    </div>
  );
}
