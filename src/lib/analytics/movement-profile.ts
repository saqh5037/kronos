/**
 * Pure helpers to build a movement profile for an athlete.
 *
 * Combines PR history (Fase 1), score frequency, and box-wide percentile
 * into a single object ready for a UI card.
 */

import {
  buildPRProgression,
  type PRAttemptInput,
  type PRProgressionPoint,
} from "../prs/log";
import { daysSinceLastAttempt, isStale } from "../prs/freshness";
import { computePercentile } from "./percentile";

export type MovementProfileInput = {
  attempts: PRAttemptInput[];
  /** Current bests of every athlete in the box for this movement (own value included). */
  boxCurrentBests: number[];
  /** Score events the athlete logged in the lookback window. Used for frequency. */
  scoresInWindow: { date: Date | string }[];
  /** Stale-flag threshold in days (default 30). */
  staleThresholdDays?: number;
};

export type MovementProfile = {
  frequency90d: number;
  lastPR: { value: number; achievedAt: string } | null;
  daysSinceLastAttempt: number | null;
  isStale: boolean;
  progression: PRProgressionPoint[];
  /** `null` when the athlete has no mark on this movement, or the box has no cohort. */
  percentileInBox: number | null;
  /** 1 is best. `null` when there is no position to hold (see above). */
  rankInBox: number | null;
  totalAthletesInBox: number;
  currentBest: number | null;
};

export function buildMovementProfile(
  input: MovementProfileInput,
): MovementProfile {
  const threshold = input.staleThresholdDays ?? 30;

  const progression = buildPRProgression(input.attempts, "WEIGHT");
  const lastPoint =
    progression.length > 0 ? progression[progression.length - 1] : null;
  const currentBest = lastPoint?.value ?? null;

  const lastPR = lastPoint
    ? { value: lastPoint.value, achievedAt: lastPoint.date }
    : null;

  const days = lastPR ? daysSinceLastAttempt(lastPR.achievedAt) : null;
  const stale = isStale(lastPR?.achievedAt ?? null, threshold);

  // An athlete with no mark on this movement is not ranked last, they are not
  // ranked at all — the cohort size stays real so the UI can still say how many
  // athletes have logged it (audit 2026-09-15: the card read "#0 DE 0").
  const peers =
    currentBest === null
      ? {
          percentile: null,
          rank: null,
          total: input.boxCurrentBests.length,
          betterThan: 0,
        }
      : computePercentile(input.boxCurrentBests, currentBest, false);

  return {
    frequency90d: input.scoresInWindow.length,
    lastPR,
    daysSinceLastAttempt: days,
    isStale: stale,
    progression,
    percentileInBox: peers.percentile,
    rankInBox: peers.rank,
    totalAthletesInBox: peers.total,
    currentBest,
  };
}
