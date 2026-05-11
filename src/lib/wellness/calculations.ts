/**
 * Pure helpers for wellness module. No DB, no React.
 */

import type { BodyMetricType } from "@/lib/validations/body-metric";

export type Trend = "up" | "down" | "flat";

/**
 * Body Mass Index. Returns null when inputs are invalid (zero or negative).
 */
export function calcBMI(weightKg: number, heightCm: number): number | null {
  if (weightKg <= 0 || heightCm <= 0) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/**
 * Trend over an ordered series (oldest → newest). Returns "flat" when the
 * absolute delta between the last two values is within 1% of the previous
 * value (or under 0.05 absolute for tiny values).
 */
export function detectTrend(values: number[]): Trend {
  if (values.length < 2) return "flat";
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const tol = Math.abs(prev) * 0.01 || 0.05;
  if (Math.abs(last - prev) <= tol) return "flat";
  return last > prev ? "up" : "down";
}

/**
 * Format a measurement: round to 1 decimal, append unit when present.
 * Integers drop the decimal.
 */
export function formatMeasurement(value: number, unit: string): string {
  const rounded = Math.round(value * 10) / 10;
  const str = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  return unit ? `${str} ${unit}` : str;
}

/**
 * Default unit for a given metric type. BMI/CUSTOM return "" — caller decides.
 */
export function defaultUnitFor(type: BodyMetricType): string {
  switch (type) {
    case "WEIGHT":
      return "kg";
    case "BODY_FAT":
    case "MUSCLE_MASS":
      return "%";
    case "HEIGHT":
    case "WAIST":
    case "HIP":
    case "ARM":
    case "THIGH":
    case "CHEST":
      return "cm";
    case "BMI":
    case "CUSTOM":
      return "";
    default:
      return "";
  }
}

/**
 * Direction-aware progress for wellness goals. Auto-detects whether the
 * target requires increasing (e.g. muscle mass) or decreasing (e.g. weight
 * loss) from the start. Returns pct 0-100 plus context for UI.
 */
export type WellnessProgress = {
  pct: number;
  direction: "ascending" | "descending";
  deltaRemaining: number;
  achieved: boolean;
};

export function calcWellnessProgress(input: {
  startValue: number;
  currentValue: number;
  targetValue: number;
}): WellnessProgress {
  const { startValue, currentValue, targetValue } = input;
  const direction: "ascending" | "descending" =
    targetValue >= startValue ? "ascending" : "descending";

  const span = Math.abs(targetValue - startValue);
  if (span === 0) {
    const achieved = currentValue === targetValue;
    return {
      pct: achieved ? 100 : 0,
      direction,
      deltaRemaining: 0,
      achieved,
    };
  }

  const progressed =
    direction === "ascending"
      ? currentValue - startValue
      : startValue - currentValue;
  const pctRaw = (progressed / span) * 100;
  const pct = Math.max(0, Math.min(100, Math.round(pctRaw * 10) / 10));

  const achieved =
    direction === "ascending"
      ? currentValue >= targetValue
      : currentValue <= targetValue;

  const deltaRemaining = achieved
    ? 0
    : direction === "ascending"
      ? targetValue - currentValue
      : currentValue - targetValue;

  return {
    pct: achieved ? 100 : pct,
    direction,
    deltaRemaining: Math.round(deltaRemaining * 10) / 10,
    achieved,
  };
}
