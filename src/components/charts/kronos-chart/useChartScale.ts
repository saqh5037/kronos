"use client";

import { useMemo } from "react";

export interface ChartPoint<T = unknown> {
  x: number;
  y: number;
  raw: T;
}

export interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartScale<T = unknown> {
  width: number;
  height: number;
  padding: ChartPadding;
  innerWidth: number;
  innerHeight: number;
  xScale: (x: number) => number;
  yScale: (y: number) => number;
  inverseX: (px: number) => number;
  yTicks: number[];
  xTicks: number[];
  domain: { x: [number, number]; y: [number, number] };
  points: ChartPoint<T>[];
}

const DEFAULT_PADDING: ChartPadding = {
  top: 16,
  right: 14,
  bottom: 26,
  left: 44,
};

export interface UseChartScaleOptions {
  padding?: Partial<ChartPadding>;
  yTickCount?: number;
  xTickCount?: number;
  yPad?: number;
  niceY?: boolean;
}

export function useChartScale<T>(
  points: ChartPoint<T>[],
  width: number,
  height: number,
  options: UseChartScaleOptions = {},
): ChartScale<T> | null {
  return useMemo(() => {
    if (points.length < 1 || width <= 0 || height <= 0) return null;

    const padding: ChartPadding = {
      ...DEFAULT_PADDING,
      ...(options.padding ?? {}),
    };

    const innerWidth = Math.max(1, width - padding.left - padding.right);
    const innerHeight = Math.max(1, height - padding.top - padding.bottom);

    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);

    let xMin = Math.min(...xs);
    let xMax = Math.max(...xs);
    if (xMin === xMax) {
      xMin -= 1;
      xMax += 1;
    }

    let yMin = Math.min(...ys);
    let yMax = Math.max(...ys);
    const yRange = yMax - yMin || Math.max(1, Math.abs(yMax) * 0.1);
    const yPadAmount = yRange * (options.yPad ?? 0.14);
    yMin -= yPadAmount;
    yMax += yPadAmount;

    if (options.niceY !== false) {
      const niced = niceDomain(yMin, yMax, options.yTickCount ?? 5);
      yMin = niced.min;
      yMax = niced.max;
    }
    if (yMin === yMax) yMax = yMin + 1;

    const xScale = (x: number) =>
      padding.left + ((x - xMin) / (xMax - xMin)) * innerWidth;
    const yScale = (y: number) =>
      padding.top + (1 - (y - yMin) / (yMax - yMin)) * innerHeight;
    const inverseX = (px: number) =>
      xMin + ((px - padding.left) / innerWidth) * (xMax - xMin);

    const yTickCount = options.yTickCount ?? 5;
    const yTicks = Array.from(
      { length: yTickCount },
      (_, i) => yMin + ((yMax - yMin) * i) / (yTickCount - 1),
    );

    const xTickCount = Math.min(options.xTickCount ?? 5, points.length);
    const xTicks =
      points.length <= xTickCount
        ? xs.slice()
        : Array.from(
            { length: xTickCount },
            (_, i) => xMin + ((xMax - xMin) * i) / (xTickCount - 1),
          );

    return {
      width,
      height,
      padding,
      innerWidth,
      innerHeight,
      xScale,
      yScale,
      inverseX,
      yTicks,
      xTicks,
      domain: { x: [xMin, xMax], y: [yMin, yMax] },
      points,
    };
  }, [points, width, height, options]);
}

function niceDomain(
  min: number,
  max: number,
  tickCount: number,
): { min: number; max: number; step: number } {
  const range = max - min;
  if (range === 0) return { min, max: max + 1, step: 1 };
  const rough = range / Math.max(1, tickCount - 1);
  const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / pow10;
  let step: number;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  step *= pow10;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  return { min: niceMin, max: niceMax, step };
}

export function buildSmoothPath(coords: [number, number][]): string {
  if (coords.length === 0) return "";
  if (coords.length === 1) return `M ${coords[0][0]},${coords[0][1]}`;
  if (coords.length === 2)
    return `M ${coords[0][0]},${coords[0][1]} L ${coords[1][0]},${coords[1][1]}`;

  const tension = 6;
  let d = `M ${coords[0][0]},${coords[0][1]}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(coords.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / tension;
    const c1y = p1[1] + (p2[1] - p0[1]) / tension;
    const c2x = p2[0] - (p3[0] - p1[0]) / tension;
    const c2y = p2[1] - (p3[1] - p1[1]) / tension;
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

export function buildAreaPath(
  coords: [number, number][],
  baseY: number,
): string {
  if (coords.length === 0) return "";
  const linePath = buildSmoothPath(coords);
  const last = coords[coords.length - 1];
  const first = coords[0];
  return `${linePath} L ${last[0].toFixed(2)},${baseY} L ${first[0].toFixed(2)},${baseY} Z`;
}

export function findClosestIndex(points: ChartPoint[], xValue: number): number {
  if (!points.length) return -1;
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].x < xValue) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0) {
    const prev = points[lo - 1];
    const curr = points[lo];
    if (Math.abs(prev.x - xValue) < Math.abs(curr.x - xValue)) return lo - 1;
  }
  return lo;
}
