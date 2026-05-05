/**
 * Pure detectors for coach-actionable insights. No DB.
 *
 * Three patterns the coach wants surfaced:
 * - Stagnation: athlete training but not PR-ing in N days
 * - Decline:    athlete attendance dropped >X% vs previous period
 * - Improvers:  top N athletes by recent PR delta%
 */

export type Severity = "low" | "med" | "high";

/** Stagnation: athlete has trained recently but hasn't beaten a PR. */
export function detectStagnation(input: {
  daysSinceLastPR: number | null;
  trainedRecently: boolean;
  thresholdDays?: number;
}): { stagnant: boolean; severity: Severity } {
  const threshold = input.thresholdDays ?? 30;
  if (!input.trainedRecently) return { stagnant: false, severity: "low" };
  if (input.daysSinceLastPR === null)
    return { stagnant: false, severity: "low" };
  if (input.daysSinceLastPR < threshold)
    return { stagnant: false, severity: "low" };
  const severity: Severity =
    input.daysSinceLastPR >= threshold * 3
      ? "high"
      : input.daysSinceLastPR >= threshold * 2
        ? "med"
        : "low";
  return { stagnant: true, severity };
}

/** Decline: attendance ratio dropped vs previous period. */
export function detectDecline(input: {
  currentAttendanceRate: number;
  previousAttendanceRate: number;
  thresholdPct?: number;
}): { declining: boolean; deltaPct: number; severity: Severity } {
  const threshold = input.thresholdPct ?? 0.2;
  const deltaAbs = input.currentAttendanceRate - input.previousAttendanceRate;
  const deltaPct = Math.round(deltaAbs * 1000) / 1000;
  if (deltaAbs >= -threshold) {
    return { declining: false, deltaPct, severity: "low" };
  }
  const magnitude = Math.abs(deltaAbs);
  const severity: Severity =
    magnitude >= threshold * 2
      ? "high"
      : magnitude >= threshold * 1.5
        ? "med"
        : "low";
  return { declining: true, deltaPct, severity };
}

export type ImproverInput = {
  athleteId: string;
  name: string;
  recentDeltaPct: number;
  movementName?: string | null;
  lastEventAt?: Date | string | null;
};

/** Sort improvers by recent delta% desc, take top N. */
export function rankImprovers(
  inputs: ImproverInput[],
  topN = 5,
): ImproverInput[] {
  return [...inputs]
    .filter((i) => i.recentDeltaPct > 0)
    .sort((a, b) => b.recentDeltaPct - a.recentDeltaPct)
    .slice(0, topN);
}
