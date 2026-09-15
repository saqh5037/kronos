/**
 * Capability view model — turns raw buckets into something honest to render.
 *
 * Audit 2026-09-15 (P1, /atleta/perfil): the radar showed "Cardio 0" and
 * "Core 0" while Helen, Karen and Fran were on file. The 0 came from
 * `buildCapabilityBuckets`, which divides the summed contributions by
 * `movementCount` and short-circuits an empty bucket to `score: 0` — the same
 * value a genuinely terrible category would get. A category with no movements
 * has NO score, and this module is where that distinction is made.
 *
 * It also localises the category label: the pure classifier in
 * `src/lib/analytics/capability.ts` still ships `"Olympic"`, which the audit
 * flagged as an English leak in a Spanish UI ("Olympic · A MEJORAR").
 *
 * Pure: no DB, no auth, no React.
 */

import { capabilityScoreLabel } from "./copy";

/** The shape `buildCapabilityBuckets` produces, narrowed to what the view needs. */
export type CapabilityBucketInput = {
  category: string;
  label: string;
  score: number;
  movementCount: number;
  rawValue?: number;
};

export type CapabilityCategoryView = {
  category: string;
  /** Neutral Mexican Spanish label. */
  name: string;
  /** `null` when the category has no movements on file — never a fabricated 0. */
  score: number | null;
  /** Ready-to-render string: the rounded score, or "sin datos". */
  display: string;
  movementCount: number;
  hasData: boolean;
};

/** Spanish overrides for labels the pure classifier still emits in English. */
const CATEGORY_NAME_ES: Record<string, string> = {
  STRENGTH: "Fuerza",
  OLYMPIC: "Olímpico",
  CARDIO: "Cardio",
  GYMNASTIC: "Gimnástico",
  CORE: "Core",
};

export function capabilityCategoryName(
  category: string,
  fallbackLabel: string,
): string {
  return CATEGORY_NAME_ES[category] ?? fallbackLabel;
}

export function capabilityCategoriesView(
  buckets: readonly CapabilityBucketInput[],
): CapabilityCategoryView[] {
  return buckets.map((b) => {
    const hasData = b.movementCount > 0;
    const score = hasData ? b.score : null;
    return {
      category: b.category,
      name: capabilityCategoryName(b.category, b.label),
      score,
      display: capabilityScoreLabel(score),
      movementCount: b.movementCount,
      hasData,
    };
  });
}
