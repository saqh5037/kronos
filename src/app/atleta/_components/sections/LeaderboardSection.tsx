/**
 * LeaderboardSection — streams the today's WOD leaderboard (top 4 scores).
 *
 * Only renders if there's a WOD today AND it has scores. Otherwise returns null.
 */

import Link from "next/link";
import { getTodayWODWithScoresCached } from "../request-cache";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import RevealOnScroll from "@/components/kronos/RevealOnScroll";
import { formatScore } from "@/lib/scores";
import type { ScoreType } from "@/lib/validations/wod";

export async function LeaderboardSection() {
  const { wod, scores } = await getTodayWODWithScoresCached();
  const topScores = scores.slice(0, 4);

  if (!wod || topScores.length === 0) return null;

  return (
    <RevealOnScroll variant="fade-up" className="mt-5">
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          padding: "0 18px 8px",
        }}
      >
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
          Leaderboard · {wod.wodName.toUpperCase()} HOY
        </span>
        <Link
          href="/atleta/wod"
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: "var(--k-t2)",
            textDecoration: "none",
          }}
        >
          VER TODOS →
        </Link>
      </div>
      <div className="px-3.5">
        <div
          style={{
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <AnimatedSection>
            {topScores.map((s, i, a) => {
              const isTop3 = i < 3;
              const rankColor = isTop3 ? "var(--k-t2)" : "var(--k-t3)";
              return (
                <AnimatedItem key={s.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      borderBottom:
                        i < a.length - 1 ? "1px solid var(--k-line)" : "none",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--k-font-display)",
                        fontSize: 18,
                        fontWeight: 700,
                        width: 20,
                        textAlign: "center",
                        color: rankColor,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--k-font-display)",
                        fontSize: 10,
                        fontWeight: 700,
                        background: "var(--k-elevated)",
                        border: "1px solid var(--k-line)",
                        color: isTop3 ? "var(--k-t2)" : "var(--k-t3)",
                      }}
                    >
                      {s.athlete.firstName[0]}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontFamily: "var(--k-font-body)",
                        fontWeight: 500,
                        color: "var(--k-t1)",
                      }}
                    >
                      {s.athlete.firstName} {s.athlete.lastName?.[0]}.
                    </div>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 999,
                        fontFamily: "var(--k-font-display)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        background: "var(--k-elevated)",
                        color:
                          s.scaling === "RX" ? "var(--k-t2)" : "var(--k-t3)",
                        border: "1px solid var(--k-line)",
                      }}
                    >
                      {s.scaling}
                    </span>
                    <div
                      style={{
                        fontFamily: "var(--k-font-display)",
                        fontSize: 14,
                        fontWeight: 700,
                        minWidth: 54,
                        textAlign: "right",
                        color: "var(--k-t1)",
                      }}
                    >
                      {formatScore(
                        Number(s.value),
                        s.wod.scoreType as ScoreType,
                      )}
                    </div>
                  </div>
                </AnimatedItem>
              );
            })}
          </AnimatedSection>
        </div>
      </div>
    </RevealOnScroll>
  );
}
