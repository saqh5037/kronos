/**
 * Chart colour tokens — Kronos V3 "Cuarto Oscuro".
 *
 * One brand hue (lime neon). Categories are separated by OPACITY, never by hue
 * (project rule: "opacity for intensity, colour for different things"). Warning
 * and danger stay in this file but are reserved for real semantics — they are
 * deliberately absent from `CHART_PALETTE` so no decorative series can pick them
 * up (audit 2026-09-15 removed `pink: "#FFB020"`, the warning token aliased as a
 * series colour).
 */

/** The single brand hue, as RGB channels, so opacity can be applied cheaply. */
export const LIME_RGB = [200, 255, 45] as const;

const LIME = "#C8FF2D";
const LIME_PRESS = "#A8D726";

export const CHART_COLORS = {
  // Brand primary spectrum — one hue, intensity via opacity.
  primary: LIME,
  primaryBright: LIME,
  secondary: LIME,
  secondaryBright: LIME,
  tertiary: LIME,
  tertiaryBright: LIME,
  accent: LIME_PRESS,

  // Semantic data colours — only for real semantics.
  positive: LIME,
  negative: "#FF5A5A",
  neutral: "#8A8A94",
  warning: "#FFB020",

  // Supporting
  steel: "#8A8A94",
  moss: LIME,
  ember: LIME_PRESS,
  fire: LIME,
  amber: LIME_PRESS,

  // Grids & reference lines
  grid: "rgba(255, 255, 255, 0.06)",
  gridStrong: "rgba(255, 255, 255, 0.10)",
  text2: "#8A8A94",
  text3: "#7D7D87",

  // Gradient stops (for area fills) — lima neon
  primaryFillStart: "rgba(200, 255, 45, 0.18)",
  primaryFillEnd: "rgba(200, 255, 45, 0.0)",
  secondaryFillStart: "rgba(200, 255, 45, 0.12)",
  secondaryFillEnd: "rgba(200, 255, 45, 0.0)",
} as const;

export type ChartTone =
  | "primary"
  | "secondary"
  | "tertiary"
  | "positive"
  | "negative"
  | "neutral"
  | "warning";

const INTENSITY_FLOOR = 0.18;

function clamp01(t: number): number {
  if (!Number.isFinite(t)) return 0;
  if (t < 0) return 0;
  if (t > 1) return 1;
  return t;
}

/**
 * Alpha for a normalised intensity `t` ∈ [0, 1], lifted off zero so the faintest
 * bucket is still visible. `floor` lets a chart fade fully to transparent.
 */
export function intensityOpacity(t: number, floor = INTENSITY_FLOOR): number {
  const clamped = clamp01(t);
  return floor + clamped * (1 - floor);
}

/**
 * Monochrome lime scale: `intensity(0)` is a faint lime, `intensity(1)` is full
 * lime. Use this instead of switching to warning/danger for low/mid/high buckets.
 */
export function intensity(t: number, floor = INTENSITY_FLOOR): string {
  const alpha = intensityOpacity(t, floor);
  const rounded = Number(alpha.toFixed(3));
  return `rgba(${LIME_RGB[0]}, ${LIME_RGB[1]}, ${LIME_RGB[2]}, ${rounded})`;
}

/**
 * Categorical series palette. Same hue at descending opacity — a chart with four
 * categories reads as one system and never borrows a semantic colour.
 */
export const CHART_PALETTE: string[] = [
  intensity(1),
  intensity(0.62),
  intensity(0.38),
  intensity(0.2),
  intensity(0.08),
  intensity(0),
];

export const DEFAULT_TONES: ChartTone[] = [
  "primary",
  "secondary",
  "tertiary",
] as ChartTone[];

// Tone → colour resolver
export function resolveTone(tone: ChartTone): string {
  const map: Record<ChartTone, string> = {
    primary: CHART_COLORS.primary,
    secondary: CHART_COLORS.secondary,
    tertiary: CHART_COLORS.tertiary,
    positive: CHART_COLORS.positive,
    negative: CHART_COLORS.negative,
    neutral: CHART_COLORS.neutral,
    warning: CHART_COLORS.warning,
  };
  return map[tone] ?? CHART_COLORS.primary;
}
