/**
 * ScoresSection — historial de scores + activity chart.
 *
 * Audit 2026-09-15 (P1 dataviz, /atleta/perfil): the activity chart labels read
 * "07- 08- 09- 10- 11- 14- 14-" — `formatDayMonth(...).slice(0, 3)` chopped
 * "14 sep" to "14-" and two scores on the same day produced two identical
 * labels. Labels now come from `formatDateShort` and repeat days are collapsed
 * into one bar, so every label is a distinct, readable date.
 *
 * Uses listMyScores(30) directly (single consumer within this route's Suspense).
 */

import { listMyScores } from "@/server/actions/scores";
import { formatScore } from "@/lib/scores";
import { formatDayMonth } from "@/lib/week";
import { formatDateShort } from "@/lib/format";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import KCard from "@/components/kronos/KCard";
import MiniBarChart from "@/components/kronos/MiniBarChart";

/** One bar per day: the day's best-effort count of logged scores. */
function scoresPerDay(
  scores: { createdAt: Date }[],
  days = 7,
): { label: string; count: number }[] {
  const byDay = new Map<string, { label: string; count: number }>();
  for (const s of scores) {
    const d = new Date(s.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const existing = byDay.get(key);
    if (existing) existing.count += 1;
    else byDay.set(key, { label: formatDateShort(d), count: 1 });
  }
  // `scores` arrives newest-first; take the most recent days, then flip so the
  // chart reads left→right in time.
  return Array.from(byDay.values()).slice(0, days).reverse();
}

export async function ScoresSection() {
  let scores = [];
  try {
    scores = await listMyScores(30);
  } catch {
    return null;
  }

  if (scores.length === 0) return null;

  const activity = scoresPerDay(scores);
  const maxCount = Math.max(1, ...activity.map((a) => a.count));

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
                    style={{ color: "var(--k-t1)" }}
                  >
                    {formatScore(s.value, s.scoreType)}
                  </span>
                </div>
              </KCard>
            </AnimatedItem>
          ))}
        </div>
      </AnimatedSection>

      {/* Activity: how often you logged, by day */}
      {activity.length >= 3 && (
        <AnimatedSection className="mt-5 px-3.5">
          <AnimatedItem>
            <KCard>
              <div className="p-4">
                <div className="k-eyebrow mb-3">SCORES REGISTRADOS POR DÍA</div>
                <MiniBarChart
                  bars={activity.map((a) => ({
                    value: a.count / maxCount,
                    label: a.label,
                    isBest: a.count === maxCount,
                  }))}
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
