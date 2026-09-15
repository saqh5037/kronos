/**
 * GoalsSection — active athlete goals with Plan IA links.
 *
 * Audit 2026-09-15 (P1 copy, /atleta/perfil): a goal with no movement rendered
 * its raw enum as the title ("ATTENDANCE"). It now falls back to
 * `goalMetricLabel`, and the deadline reads as a countdown ("faltan 18 días")
 * instead of a date the athlete has to subtract in their head.
 *
 * Optional: wraps fetch in try/catch → returns null on failure.
 */

import Link from "next/link";
import type { Route } from "next";
import { Sparkles } from "lucide-react";
import { listMyGoals } from "@/server/actions/goals";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import { goalMetricLabel } from "@/lib/labels";
import { formatDeadlineWithCountdown } from "@/lib/scores/copy";
import type { GoalMetric } from "@prisma/client";

export async function GoalsSection() {
  let myGoals = [];
  try {
    myGoals = await listMyGoals();
  } catch {
    return null;
  }

  const activeGoals = myGoals.filter((g) => g.status === "ACTIVE");
  if (activeGoals.length === 0) return null;

  const now = new Date();

  return (
    <AnimatedSection className="mt-6">
      <div className="flex items-baseline justify-between px-[18px] pb-2.5">
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.18em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
          }}
        >
          Mis objetivos
        </span>
        <div
          className="font-mono text-[10px] font-bold tracking-[0.12em]"
          style={{ color: "var(--k-t3)" }}
        >
          {activeGoals.length} ACTIVO{activeGoals.length === 1 ? "" : "S"}
        </div>
      </div>
      <div className="px-3.5 grid grid-cols-1 gap-2.5">
        {activeGoals.slice(0, 3).map((g) => (
          <AnimatedItem key={g.id}>
            <div
              style={{
                position: "relative",
                padding: 14,
                background: "var(--k-surface)",
                border: "1px solid var(--k-line)",
                borderRadius: 16,
                boxShadow: "0 0 14px rgba(200, 255, 45, 0.10)",
              }}
            >
              <div className="relative flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontWeight: 700,
                      fontSize: 18,
                      letterSpacing: "-0.01em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "var(--k-t1)",
                    }}
                  >
                    {g.movementName ??
                      goalMetricLabel[g.metric as GoalMetric] ??
                      "Objetivo"}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--k-font-display)",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        color: "var(--k-t2)",
                        textTransform: "uppercase",
                      }}
                    >
                      META {g.targetValue} {g.unit}
                    </span>
                    <span
                      aria-hidden
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 999,
                        background: "var(--k-t3)",
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--k-font-display)",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        color: "var(--k-t2)",
                      }}
                    >
                      {Math.round(g.progress.pct)}%
                    </span>
                    <span
                      aria-hidden
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 999,
                        background: "var(--k-t3)",
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--k-font-body)",
                        fontSize: 11,
                        color: "var(--k-t3)",
                      }}
                    >
                      {formatDeadlineWithCountdown(g.deadline, now)}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/atleta/plan?goalId=${g.id}` as Route}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    minHeight: 44,
                    padding: "10px 16px",
                    background: "var(--k-t1)",
                    color: "var(--k-bg)",
                    fontFamily: "var(--k-font-display)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    borderRadius: 10,
                    flexShrink: 0,
                  }}
                >
                  <Sparkles width={12} height={12} aria-hidden />
                  Plan IA
                </Link>
              </div>
            </div>
          </AnimatedItem>
        ))}
      </div>
    </AnimatedSection>
  );
}
