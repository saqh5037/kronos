import Link from "next/link";
import { generateGoalPlan } from "@/server/actions/ai";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";

export const metadata = { title: "Kronos — Plan IA" };

export default async function AtletaPlanPage(props: {
  searchParams: Promise<{ goalId?: string }>;
}) {
  const params = await props.searchParams;
  const goalId = params.goalId;

  if (!goalId) {
    return (
      <div className="px-4 pt-14 pb-28">
        <h1 className="font-display text-2xl font-bold mb-3">
          Plan personalizado
        </h1>
        <div className="k-card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Falta el goal. Volvé a tu perfil y elegí un objetivo activo.
          </p>
          <Link
            href="/atleta/perfil"
            className="mt-3 inline-block k-chip-ghost px-3 py-1.5 text-xs"
          >
            ← A perfil
          </Link>
        </div>
      </div>
    );
  }

  const result = await generateGoalPlan(goalId);
  if (!result) {
    return (
      <div className="px-4 pt-14 pb-28">
        <h1 className="font-display text-2xl font-bold mb-3">
          Plan personalizado
        </h1>
        <div className="k-card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            No encontramos ese objetivo o no es tuyo.
          </p>
          <Link
            href="/atleta/perfil"
            className="mt-3 inline-block k-chip-ghost px-3 py-1.5 text-xs"
          >
            ← A perfil
          </Link>
        </div>
      </div>
    );
  }

  const { plan, goal } = result;
  const isAI = plan.source === "ai";
  const fmtDeadline = goal.deadline.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="px-4 pt-14 pb-28 relative">
      {/* HERO PLAN — radical brand */}
      <div className="relative pb-6 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 0% 0%, rgba(230,0,38,0.10), transparent 60%), radial-gradient(ellipse at 100% 100%, rgba(0,191,255,0.10), transparent 60%)",
          }}
        />
        <span className="k-corner-tl" aria-hidden />
        <span className="k-corner-tr" aria-hidden />

        <AnimatedSection className="relative">
          <AnimatedItem>
            <Link
              href="/atleta/perfil"
              className="font-mono text-[10px] tracking-[0.16em] font-bold uppercase text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
            >
              ← Mi perfil
            </Link>
          </AnimatedItem>
          <AnimatedItem className="mt-3">
            <span className="k-eyebrow-bar">
              Kronos AI · Plan personalizado
            </span>
          </AnimatedItem>
          <AnimatedItem className="mt-2">
            <div className="flex flex-col gap-1">
              <span
                className="font-script text-[28px] leading-none"
                style={{ color: "var(--brand-red)" }}
              >
                Tu objetivo,
              </span>
              <h1
                className="k-h-italic font-display font-extrabold text-[40px] leading-[1.05] tracking-[-0.025em]"
                style={{ color: "var(--text)" }}
              >
                {goal.movementName ?? "objetivo"}{" "}
                <em>
                  {goal.targetValue} {goal.unit}
                </em>
              </h1>
            </div>
            <p className="text-[12px] mt-3" style={{ color: "var(--text-2)" }}>
              Para el {fmtDeadline} · {plan.weeks.length} semanas · fuente:{" "}
              <span
                className="font-mono uppercase tracking-[0.12em] font-bold"
                style={{
                  color: isAI ? "var(--brand-red)" : "var(--text-3)",
                }}
              >
                {isAI ? "Gemini" : "fallback"}
              </span>
            </p>
          </AnimatedItem>
        </AnimatedSection>
      </div>

      <AnimatedSection>
        <AnimatedItem>
          <div className="k-card-brand relative">
            <span className="k-corner-bl" aria-hidden />
            <span className="k-corner-br" aria-hidden />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: "var(--grad-soft)", opacity: 0.55 }}
            />
            <div className="relative">
              <span className="k-eyebrow-bar mb-2">Estrategia</span>
              <p
                className="text-[15px] leading-[1.6] mt-2 font-medium"
                style={{ color: "var(--text)" }}
              >
                {plan.overview}
              </p>
            </div>
          </div>
        </AnimatedItem>

        <div className="mt-5 space-y-2.5">
          {plan.weeks.map((w) => (
            <AnimatedItem key={w.weekNumber}>
              <details
                className="group rounded-[16px] overflow-hidden relative"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--line-strong)",
                }}
              >
                <summary className="flex items-center gap-3.5 px-4 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <div
                    className="k-h-italic font-display font-extrabold text-[28px] w-12 text-center leading-none"
                    style={{
                      background: "var(--grad)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    <em>{w.weekNumber}</em>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-display font-bold text-[15px] tracking-[-0.01em]"
                      style={{ color: "var(--text)" }}
                    >
                      Semana {w.weekNumber}
                    </div>
                    <div
                      className="font-mono text-[10px] tracking-[0.08em] mt-1 uppercase font-bold"
                      style={{ color: "var(--brand-blue)" }}
                    >
                      {w.focus} · {w.sessions.length} sesiones
                    </div>
                  </div>
                  <span
                    className="font-mono text-[12px] tracking-[0.16em] font-bold opacity-50 group-open:rotate-180 transition-transform"
                    style={{ color: "var(--text-2)" }}
                    aria-hidden
                  >
                    ▾
                  </span>
                </summary>
                <div
                  className="px-4 pb-4 pt-2"
                  style={{
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <ul className="space-y-2 mt-2">
                    {w.sessions.map((s, i) => (
                      <li
                        key={i}
                        className="grid grid-cols-[40px_72px_1fr] gap-3 text-[13px] items-baseline"
                      >
                        <span
                          className="font-mono font-bold tracking-[0.06em] text-[11px]"
                          style={{ color: "var(--text-3)" }}
                        >
                          {s.day}
                        </span>
                        <span
                          className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded inline-block text-center"
                          style={{
                            color: "var(--brand-blue)",
                            background: "var(--blue-soft)",
                            border: "1px solid var(--blue-line)",
                          }}
                        >
                          {s.type}
                        </span>
                        <span style={{ color: "var(--text)" }}>
                          {s.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {w.notes && (
                    <p
                      className="mt-3.5 text-[12px] leading-[1.5] italic pl-3 border-l-2"
                      style={{
                        color: "var(--text-2)",
                        borderColor: "var(--brand-red)",
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

        <AnimatedItem className="mt-6">
          <div className="k-divider mb-4" />
          <p
            className="text-[11px] leading-[1.6] text-center px-4 italic"
            style={{ color: "var(--text-3)" }}
          >
            Plan generado a partir de tu historial. Es una guía — adaptá con tu
            coach según fatiga, lesiones y disponibilidad. No reemplaza la
            programación oficial del box.
          </p>
        </AnimatedItem>
      </AnimatedSection>
    </div>
  );
}
