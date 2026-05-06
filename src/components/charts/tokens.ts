/**
 * Chart color tokens — Kronos Brand Palette v2.0
 * Unificados con el Manual de Marca: red → blue → cyan
 * Light mode uses the base hex values; dark mode equivalents are brighter.
 */

// Base brand colors (light mode)
const BRAND = {
  red: "#e60026",
  blue: "#0044ff",
  cyan: "#00bfff",
  pink: "#ff4d8a",
  blueDeep: "#001a99",
} as const;

export const CHART_COLORS = {
  // Brand primary spectrum
  primary: BRAND.cyan,
  primaryBright: "#33ccff",
  secondary: BRAND.blue,
  secondaryBright: "#4d79ff",
  tertiary: BRAND.red,
  tertiaryBright: "#ff3355",
  accent: BRAND.pink,

  // Semantic data colors
  positive: "#00bfff", // cyan — asistidos, success
  negative: "#e60026", // red — no-shows, errors
  neutral: "#0044ff", // blue — reservados, info
  warning: "#ff4d8a", // pink — warnings

  // Supporting
  steel: "#4a4a5a",
  moss: "#00a8a8",
  ember: "#ff4d8a",
  fire: "#e60026",
  amber: "#d97706",

  // Grids & reference lines
  grid: "rgba(127, 127, 127, 0.10)",
  gridStrong: "rgba(127, 127, 127, 0.18)",
  text2: "rgba(127, 127, 127, 0.9)",
  text3: "rgba(127, 127, 127, 0.55)",

  // Gradient stops (for area fills)
  primaryFillStart: "rgba(0, 191, 255, 0.25)",
  primaryFillEnd: "rgba(0, 191, 255, 0.02)",
  secondaryFillStart: "rgba(0, 68, 255, 0.20)",
  secondaryFillEnd: "rgba(0, 68, 255, 0.02)",
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
