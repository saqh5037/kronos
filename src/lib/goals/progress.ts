/**
 * Pure helpers for goal progress. No DB.
 */

export type GoalMetric = "PR" | "TONNAGE" | "ATTENDANCE";

export type GoalLike = {
  metric: GoalMetric;
  targetValue: number;
  startValue?: number | null;
  deadline: Date | string;
  createdAt: Date | string;
};

export type GoalProgress = {
  pct: number;
  daysLeft: number;
  totalDays: number;
  onTrack: boolean;
  eta: string | null;
  achieved: boolean;
};

function toDate(d: Date | string): Date {
  return typeof d === "string" ? new Date(d) : d;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Compute pct, days remaining, and a naive ETA (linear projection of
 * progress to date). On-track means current pct >= elapsed % of timeline.
 */
export function computeGoalProgress(
  goal: GoalLike,
  currentValue: number,
  now: Date = new Date(),
): GoalProgress {
  const start = toDate(goal.createdAt);
  const deadline = toDate(goal.deadline);
  const totalMs = Math.max(0, deadline.getTime() - start.getTime());
  const elapsedMs = clamp(now.getTime() - start.getTime(), 0, totalMs);
  const totalDays = Math.max(1, Math.round(totalMs / 86400000));
  const daysLeft = Math.max(
    0,
    Math.ceil((deadline.getTime() - now.getTime()) / 86400000),
  );

  const baseline = goal.startValue ?? 0;
  const span = goal.targetValue - baseline;
  const pctRaw =
    span <= 0
      ? currentValue >= goal.targetValue
        ? 100
        : 0
      : ((currentValue - baseline) / span) * 100;
  const pct = clamp(Math.round(pctRaw * 10) / 10, 0, 100);

  const elapsedPct = totalMs <= 0 ? 100 : (elapsedMs / totalMs) * 100;
  const onTrack = pct + 0.5 >= elapsedPct;

  let eta: string | null = null;
  if (pct < 100 && pct > 0 && elapsedMs > 0) {
    const ratePerMs = (currentValue - baseline) / elapsedMs;
    if (ratePerMs > 0) {
      const remaining = goal.targetValue - currentValue;
      if (remaining > 0) {
        const etaMs = remaining / ratePerMs;
        const etaDate = new Date(now.getTime() + etaMs);
        eta = etaDate.toISOString();
      }
    }
  }

  return {
    pct,
    daysLeft,
    totalDays,
    onTrack,
    eta,
    achieved: pct >= 100,
  };
}
