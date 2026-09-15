/**
 * Metric direction — the single source of truth for "which way is better".
 *
 * Audit 2026-09-15, systemic issue S10: the home "MURPH HOY" board ranked
 * 11:48, 9:04, 4:04, 9:00 as 1–4 because it reused `listScoresForWOD`, which
 * orders by `createdAt desc`. Every ranking surface must now sort through
 * `compareByMetric` / `sortByMetric` so direction can never drift again.
 *
 * Pure: no DB, no auth, no React.
 */

import type { ScoreType } from "@/lib/validations/wod";

export type MetricDirection = "asc" | "desc";

/** TIME is a race (lower wins); REPS / WEIGHT / ROUNDS_REPS are "more is better". */
export function scoreDirection(scoreType: ScoreType): MetricDirection {
  return scoreType === "TIME" ? "asc" : "desc";
}

/**
 * PRs are stored per movement with a free-text `unit` and no scoreType, so the
 * direction has to be inferred from the unit. Anything that measures time ranks
 * ascending; everything else (kg, lb, reps, rounds, m, cal) descending.
 */
const TIME_UNITS = new Set([
  "s",
  "sec",
  "secs",
  "seg",
  "segs",
  "segundo",
  "segundos",
  "second",
  "seconds",
  "min",
  "mins",
  "minuto",
  "minutos",
  "minute",
  "minutes",
  "mm:ss",
  "tiempo",
  "time",
]);

export function unitDirection(
  unit: string | null | undefined,
): MetricDirection {
  if (!unit) return "desc";
  return TIME_UNITS.has(unit.trim().toLowerCase()) ? "asc" : "desc";
}

/** Comparator usable directly in `Array.prototype.sort`. Best first. */
export function compareByDirection(
  a: number,
  b: number,
  direction: MetricDirection,
): number {
  return direction === "asc" ? a - b : b - a;
}

export function compareByMetric(
  a: number,
  b: number,
  scoreType: ScoreType,
): number {
  return compareByDirection(a, b, scoreDirection(scoreType));
}

/** Returns true when `candidate` beats `current` for this direction. */
export function isBetterByDirection(
  current: number,
  candidate: number,
  direction: MetricDirection,
): boolean {
  return direction === "asc" ? candidate < current : candidate > current;
}

/**
 * Stable "best first" sort. Never mutates the input.
 * Ties keep their original relative order (Array#sort is stable in ES2019+).
 */
export function sortByDirection<T>(
  items: readonly T[],
  value: (item: T) => number,
  direction: MetricDirection,
): T[] {
  return [...items].sort((a, b) =>
    compareByDirection(value(a), value(b), direction),
  );
}

export function sortByMetric<T>(
  items: readonly T[],
  value: (item: T) => number,
  scoreType: ScoreType,
): T[] {
  return sortByDirection(items, value, scoreDirection(scoreType));
}
