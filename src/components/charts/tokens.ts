/**
 * Chart color tokens — shared across recharts wrappers.
 * Colors here are static hex values; CSS vars don't resolve inside SVG `fill`
 * when the parent doesn't propagate them in some browsers, so we use the same
 * hex values that Kronos FORGE design tokens define.
 */
export const CHART_COLORS = {
  steel: "#64748b",
  moss: "#4a7c59",
  ember: "#c44536",
  fire: "#dc4b17",
  amber: "#d97706",
  cinematic: "#3aa3ff",
  cinematicBright: "#5cb8ff",
  cinematicDeep: "#0d1b2e",
  cinematicGrid: "rgba(58, 163, 255, 0.18)",
  cinematicGridStrong: "rgba(58, 163, 255, 0.32)",
  text2: "rgba(127, 127, 127, 0.9)",
  text3: "rgba(127, 127, 127, 0.55)",
  grid: "rgba(127, 127, 127, 0.18)",
} as const;

export type ChartTone = "steel" | "moss" | "ember" | "fire" | "amber";

export const CHART_PALETTE: string[] = [
  CHART_COLORS.moss,
  CHART_COLORS.steel,
  CHART_COLORS.ember,
  CHART_COLORS.fire,
  CHART_COLORS.amber,
  "#a78bfa",
];

export const DEFAULT_TONES: ChartTone[] = [
  CHART_COLORS.moss,
  CHART_COLORS.steel,
  CHART_COLORS.ember,
] as unknown as ChartTone[];
