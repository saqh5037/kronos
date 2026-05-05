/**
 * Pure helpers for PR progression analysis. No DB, no auth.
 *
 * The `PRAttempt` table stores every improvement (write-through from
 * submitScore). These helpers transform raw rows into chart-ready points.
 */

import type { ScoreType } from "../validations/wod";

export type PRAttemptInput = {
  achievedAt: Date | string;
  value: number;
  prevBest?: number | null;
};

export type PRProgressionPoint = {
  date: string;
  value: number;
  /** Improvement % vs previous PR. Always >= 0. 0 for the first attempt. */
  deltaPct: number;
  isCurrentBest: boolean;
};

function toMs(d: Date | string): number {
  return typeof d === "string" ? new Date(d).getTime() : d.getTime();
}

/**
 * Build chart-ready progression points from a list of PR attempts.
 *
 * Sorts by date ascending, computes the magnitude of improvement vs the
 * previous attempt, and flags the most recent as `isCurrentBest`.
 *
 * `deltaPct` is always non-negative — it's the magnitude of the improvement,
 * so for TIME (lower is better) and for higher-is-better metrics it has the
 * same sign convention from the athlete's perspective.
 */
export function buildPRProgression(
  attempts: PRAttemptInput[],
  scoreType: ScoreType = "WEIGHT",
): PRProgressionPoint[] {
  if (attempts.length === 0) return [];

  const sorted = [...attempts].sort(
    (a, b) => toMs(a.achievedAt) - toMs(b.achievedAt),
  );

  const lowerIsBetter = scoreType === "TIME";
  const lastIdx = sorted.length - 1;

  return sorted.map((a, i) => {
    const prev = i === 0 ? null : sorted[i - 1].value;
    let deltaPct = 0;
    if (prev !== null && prev > 0) {
      const diff = lowerIsBetter ? prev - a.value : a.value - prev;
      deltaPct = (diff / prev) * 100;
    }
    const date =
      typeof a.achievedAt === "string"
        ? a.achievedAt
        : a.achievedAt.toISOString();
    return {
      date,
      value: a.value,
      deltaPct: Math.round(deltaPct * 10) / 10,
      isCurrentBest: i === lastIdx,
    };
  });
}
