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

/**
 * Churn risk: combines 4 signals deterministically. NO Gemini.
 *
 * - daysSinceLastAttended: días desde última asistencia (>= 14 = señal)
 * - attendanceDeltaPct: cambio de tasa vs período anterior (<= -0.20 = señal)
 * - daysSinceLastPR: ningún PR reciente (>= 60 = señal)
 * - recentCancellationsRatio: % de bookings cancelados últimos 30d (>= 0.40 = señal)
 *
 * Rule: 3+ señales activas → "high", 2 señales → "med", 1 señal → "low" (no churn).
 */
export type ChurnSignals = {
  daysSinceLastAttended: number | null;
  attendanceDeltaPct: number;
  daysSinceLastPR: number | null;
  recentCancellationsRatio: number;
};

export type ChurnDetection = {
  atRisk: boolean;
  severity: Severity;
  signalCount: number;
  reasons: string[];
};

const DEFAULTS = {
  ABSENT_DAYS: 14,
  ATT_DROP_PCT: -0.2,
  STALE_PR_DAYS: 60,
  CANCEL_RATIO: 0.4,
};

export function detectChurnRisk(
  s: ChurnSignals,
  thresholds: Partial<typeof DEFAULTS> = {},
): ChurnDetection {
  const t = { ...DEFAULTS, ...thresholds };
  const reasons: string[] = [];
  let signals = 0;

  if (
    s.daysSinceLastAttended !== null &&
    s.daysSinceLastAttended >= t.ABSENT_DAYS
  ) {
    signals += 1;
    reasons.push(`${s.daysSinceLastAttended} días sin entrenar`);
  }
  if (s.attendanceDeltaPct <= t.ATT_DROP_PCT) {
    signals += 1;
    reasons.push(
      `asistencia ${Math.round(s.attendanceDeltaPct * 100)}% vs período anterior`,
    );
  }
  if (s.daysSinceLastPR !== null && s.daysSinceLastPR >= t.STALE_PR_DAYS) {
    signals += 1;
    reasons.push(`sin PR en ${s.daysSinceLastPR} días`);
  }
  if (s.recentCancellationsRatio >= t.CANCEL_RATIO) {
    signals += 1;
    reasons.push(
      `${Math.round(s.recentCancellationsRatio * 100)}% de cancelaciones recientes`,
    );
  }

  if (signals >= 3)
    return { atRisk: true, severity: "high", signalCount: signals, reasons };
  if (signals === 2)
    return { atRisk: true, severity: "med", signalCount: signals, reasons };
  return { atRisk: false, severity: "low", signalCount: signals, reasons };
}
