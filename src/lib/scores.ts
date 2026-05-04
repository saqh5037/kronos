/**
 * Pure score & PR helpers — no DB, no auth.
 */

import type { ScoreType } from "./validations/wod";

/**
 * Returns true when `candidate` is strictly better than `previous`.
 * - TIME, ROUNDS_REPS time-based: lower is better (assumes seconds for TIME).
 * - REPS, WEIGHT, ROUNDS_REPS rounds-based: higher is better.
 *
 * For ROUNDS_REPS we treat the value as a packed decimal "rounds.reps" where
 * higher is better (more rounds + more partial reps).
 */
export function isBetterScore(
  previous: number,
  candidate: number,
  scoreType: ScoreType,
): boolean {
  if (scoreType === "TIME") {
    return candidate < previous;
  }
  return candidate > previous;
}

/**
 * Decide if a new score qualifies as a Personal Record.
 * Returns the new value to record as PR, or null when it's not a PR.
 */
export function detectPR(
  previousPR: number | null,
  candidate: number,
  scoreType: ScoreType,
): number | null {
  if (previousPR === null) return candidate;
  return isBetterScore(previousPR, candidate, scoreType) ? candidate : null;
}

/**
 * Format a score value for display, given its score type.
 * TIME values are stored as seconds.
 */
export function formatScore(value: number, scoreType: ScoreType): string {
  switch (scoreType) {
    case "TIME": {
      const total = Math.round(value);
      const m = Math.floor(total / 60);
      const s = total % 60;
      return `${m}:${s.toString().padStart(2, "0")}`;
    }
    case "REPS":
      return `${Math.round(value)} reps`;
    case "WEIGHT":
      return `${value} kg`;
    case "ROUNDS_REPS": {
      const rounds = Math.floor(value);
      const reps = Math.round((value - rounds) * 100);
      return `${rounds}+${reps}`;
    }
  }
}
