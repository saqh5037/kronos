import Link from "next/link";
import { generateGoalPlan } from "@/server/actions/ai";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";

export const metadata = { title: "Kronos — Plan IA" };

const AI_PRIMARY = "#ff2bd6";
const AI_SECONDARY = "#00e5ff";

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
  const fmtDeadline = goal.deadline.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="px-4 pt-14 pb-28">
      <AnimatedSection>
        <AnimatedItem>
          <Link
            href="/atleta/perfil"
            className="font-mono text-[10px] tracking-[0.12em] font-bold uppercase text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
          >
            ← Mi perfil
          </Link>
        </AnimatedItem>
        <AnimatedItem className="mt-2 mb-3">
          <p
            className="font-mono text-[10px] tracking-[0.18em] font-bold uppercase"
            style={{ color: AI_PRIMARY }}
          >
            Kronos AI · Plan personalizado
          </p>
          <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight mt-1">
            {goal.movementName ?? "Plan"}
            {goal.metric === "PR" && goal.movementName ? " — " : ""}
            <span style={{ color: AI_PRIMARY }}>
              {goal.targetValue} {goal.unit}
            </span>
          </h1>
          <p className="text-[12px] mt-1.5" style={{ color: "var(--text-2)" }}>
            Para el {fmtDeadline} · {plan.weeks.length} semanas · fuente:{" "}
            <span
              style={{
                color: plan.source === "ai" ? AI_PRIMARY : "var(--text-3)",
              }}
            >
              {plan.source === "ai" ? "Gemini" : "fallback determinístico"}
            </span>
          </p>
        </AnimatedItem>

        <AnimatedItem className="mt-4">
          <div
            className="rounded-[14px] p-4 relative overflow-hidden"
            style={{
              background: "var(--card)",
              border: "1px solid var(--line-strong)",
              boxShadow:
                plan.source === "ai"
                  ? `0 0 0 1px ${AI_PRIMARY}33, 0 4px 18px ${AI_PRIMARY}1f`
                  : "var(--card-glow)",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  plan.source === "ai"
                    ? `radial-gradient(circle at 0% 100%, ${AI_PRIMARY}1a, transparent 60%), radial-gradient(circle at 100% 0%, ${AI_SECONDARY}14, transparent 55%)`
                    : "transparent",
              }}
            />
            <div className="relative">
              <p
                className="font-mono text-[10px] tracking-[0.16em] uppercase font-bold mb-1.5"
                style={{ color: "var(--text-3)" }}
              >
                Estrategia
              </p>
              <p
                className="text-[14px] leading-[1.5]"
                style={{ color: "var(--text)" }}
              >
                {plan.overview}
              </p>
            </div>
          </div>
        </AnimatedItem>

        <div className="mt-4 space-y-2.5">
          {plan.weeks.map((w) => (
            <AnimatedItem key={w.weekNumber}>
              <details
                className="group rounded-[14px] overflow-hidden"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--line-strong)",
                }}
              >
                <summary className="flex items-center gap-3 px-4 py-3.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <div
                    className="font-display font-extrabold text-[20px] w-10 text-center"
                    style={{ color: AI_PRIMARY }}
                  >
                    {w.weekNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-[14px]">
                      Semana {w.weekNumber} · {w.focus}
                    </div>
                    <div
                      className="font-mono text-[10px] tracking-[0.06em] mt-0.5"
                      style={{ color: "var(--text-3)" }}
                    >
                      {w.sessions.length} sesiones
                    </div>
                  </div>
                  <span
                    className="font-mono text-[10px] tracking-[0.16em] font-bold uppercase opacity-50 group-open:rotate-180 transition-transform"
                    style={{ color: "var(--text-2)" }}
                    aria-hidden
                  >
                    ▾
                  </span>
                </summary>
                <div
                  className="px-4 pb-4 pt-1"
                  style={{
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <ul className="space-y-1.5 mt-2">
                    {w.sessions.map((s, i) => (
                      <li
                        key={i}
                        className="grid grid-cols-[40px_70px_1fr] gap-2 text-[12px] items-baseline"
                      >
                        <span
                          className="font-mono font-bold tracking-[0.06em]"
                          style={{ color: "var(--text-3)" }}
                        >
                          {s.day}
                        </span>
                        <span
                          className="font-mono text-[10px] font-bold tracking-[0.08em] uppercase px-1.5 py-0.5 rounded inline-block"
                          style={{
                            color: "var(--text-2)",
                            background: "var(--bg-soft)",
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
                      className="mt-3 text-[11px] leading-[1.45] italic pl-2 border-l-2"
                      style={{
                        color: "var(--text-2)",
                        borderColor: "var(--line-strong)",
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

        <AnimatedItem className="mt-5">
          <p
            className="text-[10px] leading-[1.5] text-center px-4"
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
