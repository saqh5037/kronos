/**
 * Pure helpers to compute training volume (tonnage = reps × weight).
 *
 * Computes from WOD templates (WODMovement.reps × WODMovement.weight) modulated
 * by the score's scaling. This is "prescribed tonnage" — for AMRAP/EMOM where
 * rounds vary, the prescription gives a signal but not the literal kg moved.
 *
 * Future improvement: capture per-score reps×weight when athletes log them
 * granularly. For Fase 2 the prescription-based estimate is the contract.
 */

export type ScalingKey = "RX" | "SCALED" | "RXPLUS";

export const SCALING_FACTOR: Record<ScalingKey, number> = {
  RX: 1,
  SCALED: 0.7,
  RXPLUS: 1.05,
};

export type WODMovementInput = {
  reps: number | null;
  weight: number | null;
};

/**
 * Sum of (reps × weight) across a WOD's movements, modulated by scaling.
 * Movements without reps or weight contribute 0 (e.g., bodyweight rows).
 *
 * Returns kg with 2-decimal precision.
 */
export function computeWODTonnage(
  movements: WODMovementInput[],
  scaling: ScalingKey,
): number {
  const factor = SCALING_FACTOR[scaling] ?? 1;
  let total = 0;
  for (const m of movements) {
    const reps = m.reps ?? 0;
    const weight = m.weight ?? 0;
    if (reps <= 0 || weight <= 0) continue;
    total += reps * weight * factor;
  }
  return Math.round(total * 100) / 100;
}
