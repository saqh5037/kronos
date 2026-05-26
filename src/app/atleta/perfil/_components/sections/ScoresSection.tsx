/**
 * ScoresSection — historial de scores + activity sparkline chart.
 * Uses listMyScores(30) directly (single consumer within this route's Suspense).
 */

import { listMyScores } from "@/server/actions/scores";
import { formatScore } from "@/lib/scores";
import { formatDayMonth } from "@/lib/week";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import KCard from "@/components/kronos/KCard";
import MiniBarChart from "@/components/kronos/MiniBarChart";

export async function ScoresSection() {
  let scores = [];
  try {
    scores = await listMyScores(30);
  } catch {
    return null;
  }

  if (scores.length === 0) return null;

  return (
    <>
      {/* Historial scores list */}
      <AnimatedSection className="mt-5 px-3.5">
        <p className="k-eyebrow mb-2" style={{ color: "var(--k-t2)" }}>
          HISTORIAL DE SCORES
        </p>
        <div className="flex flex-col gap-2">
          {scores.slice(0, 10).map((s) => (
            <AnimatedItem key={s.id}>
              <KCard variant="flat">
                <div className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold text-sm truncate">
                      {s.wodName}
                    </p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "var(--k-t3)" }}
                    >
                      {formatDayMonth(s.createdAt)} · {s.scaling}
                    </p>
                  </div>
                  <span
                    className="font-mono font-bold text-sm"
                    style={{ color: "var(--text)" }}
                  >
                    {formatScore(s.value, s.scoreType)}
                  </span>
                </div>
              </KCard>
            </AnimatedItem>
          ))}
        </div>
      </AnimatedSection>

      {/* Activity sparkline */}
      {scores.length >= 3 && (
        <AnimatedSection className="mt-5 px-3.5">
          <AnimatedItem>
            <KCard>
              <div className="p-4">
                <div className="k-eyebrow mb-3">ACTIVIDAD RECIENTE</div>
                <MiniBarChart
                  bars={scores
                    .slice(0, 7)
                    .reverse()
                    .map((s, i, arr) => {
                      const vals = arr.map((x) => Number(x.value));
                      const max = Math.max(...vals);
                      const min = Math.min(...vals);
                      const range = max - min || 1;
                      return {
                        value: Math.max(0.2, (Number(s.value) - min) / range),
                        label: formatDayMonth(s.createdAt).slice(0, 3),
                        isBest: Number(s.value) === max,
                      };
                    })}
                  height={56}
                />
              </div>
            </KCard>
          </AnimatedItem>
        </AnimatedSection>
      )}
    </>
  );
}
