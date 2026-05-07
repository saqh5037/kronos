/**
 * Chart color tokens — Kronos Brand Palette v2.0
 * Unificados con el Manual de Marca: red → blue → cyan
 * Light mode uses the base hex values; dark mode equivalents are brighter.
 */

// Kronos v3 — Cuarto Oscuro (lima neon como acento único)
const BRAND = {
  red: "#C8FF2D",
  blue: "#C8FF2D",
  cyan: "#C8FF2D",
  pink: "#FFB020",
  blueDeep: "#A8D726",
} as const;

export const CHART_COLORS = {
  // Brand primary spectrum — todo lima neon, sólo varía intensidad
  primary: BRAND.cyan,
  primaryBright: "#D9FF66",
  secondary: BRAND.blue,
  secondaryBright: "#D9FF66",
  tertiary: BRAND.red,
  tertiaryBright: "#D9FF66",
  accent: BRAND.pink,

  // Semantic data colors
  positive: "#C8FF2D", // lima — asistidos, success
  negative: "#FF5A5A", // rojo brasa — no-shows, errors
  neutral: "#8A8A94", // gris medio — reservados, info
  warning: "#FFB020", // naranja — warnings

  // Supporting
  steel: "#8A8A94",
  moss: "#C8FF2D",
  ember: "#FFB020",
  fire: "#FF5A5A",
  amber: "#FFB020",

  // Grids & reference lines
  grid: "rgba(255, 255, 255, 0.06)",
  gridStrong: "rgba(255, 255, 255, 0.10)",
  text2: "rgba(245, 245, 247, 0.65)",
  text3: "rgba(245, 245, 247, 0.35)",

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

export const CHART_PALETTE: string[] = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.accent,
  CHART_COLORS.moss,
  CHART_COLORS.amber,
];

export const DEFAULT_TONES: ChartTone[] = [
  "primary",
  "secondary",
  "tertiary",
] as ChartTone[];

// Tone → color resolver
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
