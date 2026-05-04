/**
 * Chart color tokens — shared across recharts wrappers.
 * Colors here are static hex values; CSS vars don't resolve inside SVG `fill`
 * when the parent doesn't propagate them in some browsers, so we use the same
 * hex values that Kronos design tokens define.
 */
export const CHART_COLORS = {
  strain: "#3aa3ff",
  recovery: "#19f08b",
  pr: "#ff5e5e",
  text2: "rgba(127, 127, 127, 0.9)",
  text3: "rgba(127, 127, 127, 0.55)",
  grid: "rgba(127, 127, 127, 0.18)",
} as const;

export type ChartTone = "strain" | "recovery" | "pr";

export const CHART_PALETTE: string[] = [
  CHART_COLORS.strain,
  CHART_COLORS.recovery,
  CHART_COLORS.pr,
  "#a78bfa",
  "#fbbf24",
  "#f472b6",
];
