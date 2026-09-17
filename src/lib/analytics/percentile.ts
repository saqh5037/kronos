/**
 * Pure percentile/ranking helpers. No DB.
 *
 * Convention: percentile 0-100 where higher = better than more peers.
 * `lowerIsBetter` flips comparisons for TIME-based metrics.
 */

export type PercentileResult = {
  /** `null` when there is no cohort — a 0 here reads as "worse than everyone". */
  percentile: number | null;
  /** 1 is best. `null` when there is no cohort to hold a position in. */
  rank: number | null;
  total: number;
  betterThan: number;
};

export function computePercentile(
  values: number[],
  target: number,
  lowerIsBetter = false,
): PercentileResult {
  // No cohort means no position, not last place. Audit 2026-09-15: an athlete
  // with no PRs came back as `rank: 0` and the profile printed "#0 DE 0".
  if (values.length === 0) {
    return { percentile: null, rank: null, total: 0, betterThan: 0 };
  }

  let betterThan = 0;
  for (const v of values) {
    if (v === target) continue;
    if (lowerIsBetter ? target < v : target > v) betterThan += 1;
  }

  const total = values.length;
  const others = total - 1; // exclude one occurrence of target itself
  const percentile =
    others <= 0 ? 100 : Math.round((betterThan / others) * 100);
  // Rank: 1 is best. Athletes with strictly better values are ahead of target.
  const ahead = lowerIsBetter
    ? values.filter((v) => v < target).length
    : values.filter((v) => v > target).length;
  const rank = ahead + 1;

  return { percentile, rank, total, betterThan };
}
