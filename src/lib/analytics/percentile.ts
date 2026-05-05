/**
 * Pure percentile/ranking helpers. No DB.
 *
 * Convention: percentile 0-100 where higher = better than more peers.
 * `lowerIsBetter` flips comparisons for TIME-based metrics.
 */

export type PercentileResult = {
  percentile: number;
  rank: number;
  total: number;
  betterThan: number;
};

export function computePercentile(
  values: number[],
  target: number,
  lowerIsBetter = false,
): PercentileResult {
  if (values.length === 0) {
    return { percentile: 0, rank: 0, total: 0, betterThan: 0 };
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
