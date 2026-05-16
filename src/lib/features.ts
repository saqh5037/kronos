/**
 * Feature flags primitiva para Kronos multi-disciplina.
 *
 * Diseño: las features viven en `Box.features` como JSON `Record<FeatureFlag, boolean>`.
 * Cada Box puede habilitar features independientemente — no hay flag global.
 *
 * Cuándo agregar una nueva feature acá:
 * - Si es un comportamiento nuevo que queremos rollout gradual por Box (ej. hyrox UI antes
 *   de validar con todos los Boxes existentes).
 * - Si es un toggle de funcionalidad que cambia el shape del producto para ese Box.
 *
 * Cuándo NO usar esto:
 * - Para permisos de usuario → usar role + middleware.
 * - Para A/B testing analítico → PostHog feature flags.
 */

export type FeatureFlag =
  | "hyrox" // Box puede crear/programar sesiones tipo HYROX_RACE
  | "mm_athlete" // Athletes pueden tener membresías a múltiples Boxes (F2)
  | "yoga" // Box puede crear sesiones tipo YOGA_FLOW (F3 cond)
  | "pilates"; // Box puede crear sesiones tipo PILATES (F3 cond)

export const ALL_FEATURE_FLAGS: ReadonlyArray<FeatureFlag> = [
  "hyrox",
  "mm_athlete",
  "yoga",
  "pilates",
] as const;

type BoxLike = { features?: unknown };

export function boxHasFeature(box: BoxLike, flag: FeatureFlag): boolean {
  const features = parseFeatures(box.features);
  return features[flag] === true;
}

export function getEnabledFeatures(box: BoxLike): FeatureFlag[] {
  const features = parseFeatures(box.features);
  return ALL_FEATURE_FLAGS.filter((flag) => features[flag] === true);
}

export function withFeature(
  box: BoxLike,
  flag: FeatureFlag,
  enabled: boolean,
): Record<string, boolean> {
  const features = parseFeatures(box.features);
  return { ...features, [flag]: enabled };
}

function parseFeatures(raw: unknown): Record<string, boolean> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const obj = raw as Record<string, unknown>;
  const result: Record<string, boolean> = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] === true) result[key] = true;
  }
  return result;
}
