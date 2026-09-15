/**
 * Copy mappers for the athlete surface — the presentation boundary where a
 * number becomes an honest sentence.
 *
 * Audit 2026-09-15 (P1, athlete app):
 *  - "99 % CONFIANZA" on a six-week 1RM forecast is an overclaim that will be
 *    wrong in public → bands ("confianza alta/media/baja").
 *  - "#0 DE 3" / "0 % PERCENTIL" / a capability score of 0 for a category with
 *    no data read as facts. Absent data must say "sin datos".
 *  - "3 DE OCTUBRE DE 2026" told the athlete nothing actionable → "faltan N días".
 *
 * Pure: no DB, no auth, no React.
 */

import { formatDateShort } from "@/lib/format";

export type ConfidenceBand = "alta" | "media" | "baja";

/**
 * Map a model confidence into a band. Accepts 0..1 or 0..100 so callers do not
 * have to remember which scale the producer used.
 *
 * Thresholds are deliberately conservative: the audit's complaint was not the
 * arithmetic, it was publishing two significant figures of certainty about a
 * six-week projection.
 */
export function confidenceBand(confidence: number): ConfidenceBand {
  if (!Number.isFinite(confidence)) return "baja";
  const ratio = confidence > 1 ? confidence / 100 : confidence;
  if (ratio >= 0.75) return "alta";
  if (ratio >= 0.45) return "media";
  return "baja";
}

/** "confianza alta" — never a percentage. */
export function confidenceLabel(confidence: number): string {
  return `confianza ${confidenceBand(confidence)}`;
}

const MS_PER_DAY = 86_400_000;

/** Whole days between two dates, counted from local midnight to local midnight. */
export function daysUntil(target: Date, now: Date): number {
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const b = Date.UTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  return Math.round((b - a) / MS_PER_DAY);
}

/**
 * "hoy" / "mañana" / "faltan 18 días" / "venció ayer" / "venció hace 3 días".
 * Neutral Mexican Spanish, tú.
 */
export function formatDaysUntil(target: Date, now: Date): string {
  const days = daysUntil(target, now);
  if (days === 0) return "hoy";
  if (days === 1) return "mañana";
  if (days > 1) return `faltan ${days} días`;
  if (days === -1) return "venció ayer";
  return `venció hace ${Math.abs(days)} días`;
}

/** "faltan 18 días · 3 oct" — the deadline with its actionable framing first. */
export function formatDeadlineWithCountdown(target: Date, now: Date): string {
  return `${formatDaysUntil(target, now)} · ${formatDateShort(target)}`;
}

/** Zero is not a rank. `rank <= 0` or a null total means there is no cohort. */
export function rankLabel(
  rank: number | null | undefined,
  total: number | null | undefined,
): string {
  if (!rank || rank <= 0 || !total || total <= 0) return "sin datos";
  return `#${rank} de ${total}`;
}

/** A percentile of an empty cohort is not 0 %, it is nothing. */
export function percentileLabel(
  percentile: number | null | undefined,
  total: number | null | undefined = 1,
): string {
  if (
    percentile === null ||
    percentile === undefined ||
    !Number.isFinite(percentile) ||
    !total ||
    total <= 0
  ) {
    return "sin datos";
  }
  return `${Math.round(percentile)} % del box`;
}

/**
 * A capability category with no movements on file has no score. The server
 * returns null for it (see src/server/analytics/capability.ts) and this is the
 * only place that decides what null looks like.
 */
export function capabilityScoreLabel(score: number | null | undefined): string {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return "sin datos";
  }
  return String(Math.round(score));
}

/**
 * Boundary guard for AI narrative text that still leaks English tokens.
 *
 * The generator lives in `src/lib/ai/pr-prediction.ts` (outside this wave's
 * ownership) and emits "Necesitamos al menos 3 attempts para predecir". Until
 * that copy is fixed at the source, the presentation layer normalises the known
 * leaks so a Spanish screen never shows an English word.
 */
const NARRATIVE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\battempts\b/gi, "intentos"],
  [/\battempt\b/gi, "intento"],
  [/\bscore:\s*weight\s*\(kg\)/gi, "score: peso (kg)"],
];

export function normalizeNarrative(text: string): string {
  return NARRATIVE_REPLACEMENTS.reduce(
    (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
    text,
  );
}
