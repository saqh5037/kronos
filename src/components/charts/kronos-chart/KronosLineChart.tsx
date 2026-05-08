"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useReducedMotion } from "framer-motion";
import { CHART_COLORS, CHART_PALETTE } from "../tokens";
import {
  buildAreaPath,
  buildSmoothPath,
  findClosestIndex,
  useChartScale,
  type ChartPoint,
} from "./useChartScale";
import { ChartGrid } from "./ChartGrid";
import { ChartArea } from "./ChartArea";
import { ChartLine } from "./ChartLine";
import { ChartBars, type BarSpec } from "./ChartBars";
import { HeadOrb } from "./HeadOrb";
import { AxisTicks } from "./AxisTicks";
import { TooltipBubble, TooltipCrosshair } from "./ChartTooltip";

export interface KronosSeriesDef<T> {
  key: keyof T & string;
  label?: string;
  color?: string;
}

export interface KronosReferenceLine {
  y: number;
  color?: string;
  label?: string;
  dashed?: boolean;
}

export type KronosChartVariant = "default" | "cinematic";

export interface KronosLineChartProps<T> {
  data: T[];
  xKey: keyof T & string;
  /** Single-series shorthand. Use `series` for multi-line. */
  yKey?: keyof T & string;
  series?: KronosSeriesDef<T>[];
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showHeadOrb?: boolean;
  showAxis?: boolean;
  /** When true, render area gradient under the line. Default false (line only). */
  gradient?: boolean;
  animate?: boolean;
  formatY?: (v: number) => string;
  formatX?: (v: unknown) => string;
  referenceLines?: KronosReferenceLine[];
  /** Custom tooltip body for a given data row. Receives the closest row. */
  tooltipContent?: (point: T, seriesIndex: number) => ReactNode;
  emptyState?: ReactNode;
  className?: string;
  ariaLabel?: string;
  /**
   * Visual variant. `cinematic` = bars + line + intense glow + lima palette
   * over deep black panel (V3 Cuarto Oscuro look).
   */
  variant?: KronosChartVariant;
  /** When true (default in cinematic), render bars beneath the line. */
  bars?: boolean;
}

interface NormalizedSeries<T> {
  key: keyof T & string;
  label: string;
  color: string;
  points: ChartPoint<T>[];
}

function normalizeXValue(raw: unknown, fallbackIndex: number): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const t = Date.parse(raw);
    if (Number.isFinite(t)) return t;
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  if (raw instanceof Date) return raw.getTime();
  return fallbackIndex;
}

export function KronosLineChart<T>({
  data,
  xKey,
  yKey,
  series,
  color,
  height = 240,
  showGrid = true,
  showTooltip = true,
  showHeadOrb = true,
  showAxis = true,
  gradient = false,
  animate = true,
  formatY,
  formatX,
  referenceLines,
  tooltipContent,
  emptyState,
  className,
  ariaLabel,
  variant = "default",
  bars,
}: KronosLineChartProps<T>) {
  const isCinematic = variant === "cinematic";
  const resolvedColor =
    color ?? (isCinematic ? CHART_COLORS.primary : CHART_COLORS.fire);
  const showBars = bars ?? isCinematic;
  const reduce = useReducedMotion() ?? false;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(0);
  const uid = useId().replace(/[:]/g, "");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setWidth(w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const seriesList: KronosSeriesDef<T>[] = useMemo(() => {
    if (series && series.length) return series;
    if (yKey) return [{ key: yKey, color: resolvedColor, label: yKey }];
    return [];
  }, [series, yKey, resolvedColor]);

  const normalized: NormalizedSeries<T>[] = useMemo(() => {
    return seriesList.map((s, i) => {
      const seriesColor = s.color ?? CHART_PALETTE[i % CHART_PALETTE.length];
      const points: ChartPoint<T>[] = data.map((row, idx) => {
        const r = row as Record<string, unknown>;
        return {
          x: normalizeXValue(r[xKey], idx),
          y: Number(r[s.key] ?? 0),
          raw: row,
        };
      });
      return {
        key: s.key,
        label: s.label ?? s.key,
        color: seriesColor,
        points,
      };
    });
  }, [seriesList, data, xKey]);

  const allPoints = useMemo(
    () => normalized.flatMap((s) => s.points),
    [normalized],
  );

  const scale = useChartScale(allPoints, width, height);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // X tick raw values: use the first series rows aligned by index for X axis labels
  const rawXValues = useMemo(
    () => data.map((row) => (row as Record<string, unknown>)[xKey]),
    [data, xKey],
  );

  const handlePointerMove = useCallback(
    (ev: ReactPointerEvent<SVGSVGElement>) => {
      if (!showTooltip || !scale || normalized.length === 0) return;
      const rect = ev.currentTarget.getBoundingClientRect();
      const px = ev.clientX - rect.left;
      const xValue = scale.inverseX(px);
      const idx = findClosestIndex(normalized[0].points, xValue);
      setHoverIndex(idx);
    },
    [showTooltip, scale, normalized],
  );

  const handlePointerLeave = useCallback(() => {
    setHoverIndex(null);
  }, []);

  if (data.length === 0 || seriesList.length === 0) {
    return (
      <div
        ref={containerRef}
        style={{ width: "100%", height }}
        className={`flex items-center justify-center text-xs ${className ?? ""}`}
      >
        {emptyState ?? <span style={{ color: "var(--k-t3)" }}>Sin datos</span>}
      </div>
    );
  }

  const showAnim = animate;

  // Build paths once scale is known
  const builtSeries = scale
    ? normalized.map((s) => {
        const coords: [number, number][] = s.points.map((p) => [
          scale.xScale(p.x),
          scale.yScale(p.y),
        ]);
        const linePath = buildSmoothPath(coords);
        const areaPath = buildAreaPath(
          coords,
          scale.padding.top + scale.innerHeight,
        );
        return { ...s, coords, linePath, areaPath };
      })
    : [];

  const baselineY = scale ? scale.padding.top + scale.innerHeight : 0;
  const barsForFirst: BarSpec[] =
    scale && showBars && builtSeries[0] && builtSeries[0].coords.length > 0
      ? (() => {
          const coords = builtSeries[0].coords;
          const n = coords.length;
          const innerW = scale.innerWidth;
          const slot = innerW / n;
          const barW = Math.max(2, Math.min(slot * 0.55, 28));
          return coords.map(([cx, cy]) => ({
            x: cx - barW / 2,
            y: cy,
            width: barW,
            height: Math.max(0, baselineY - cy),
          }));
        })()
      : [];

  const hoverPoint =
    scale && hoverIndex != null && normalized[0]?.points[hoverIndex]
      ? normalized[0].points[hoverIndex]
      : null;
  const hoverX = hoverPoint && scale ? scale.xScale(hoverPoint.x) : 0;
  const hoverY = hoverPoint && scale ? scale.yScale(hoverPoint.y) : 0;

  return (
    <div
      ref={containerRef}
      className={className}
      data-kronos-chart=""
      data-variant={variant}
      style={{
        position: "relative",
        width: "100%",
        height,
        ...(isCinematic
          ? {
              background:
                "radial-gradient(ellipse at 50% 60%, #14141a 0%, #0f1014 65%, #08080a 100%)",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow:
                "inset 0 0 40px rgba(200, 255, 45, 0.08), 0 0 0 1px rgba(200, 255, 45, 0.12)",
            }
          : null),
      }}
      role="img"
      aria-label={ariaLabel}
    >
      {scale && (
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{
            display: "block",
            touchAction: "pan-y",
            overflow: "visible",
          }}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerLeave}
        >
          {showGrid && (
            <ChartGrid
              scale={scale}
              animate={showAnim}
              reduceMotion={reduce}
              cinematic={isCinematic}
              cinematicColor={CHART_COLORS.primary}
            />
          )}

          {isCinematic && showBars && builtSeries[0] && (
            <ChartBars
              bars={barsForFirst}
              color={builtSeries[0].color}
              baselineY={baselineY}
              gradientId={`kbars-${uid}`}
              animate={showAnim}
              reduceMotion={reduce}
              baseDelay={0.2}
            />
          )}

          {referenceLines?.map((rl, i) => {
            const y = scale.yScale(rl.y);
            return (
              <g key={`refline-${i}`}>
                <line
                  x1={scale.padding.left}
                  x2={scale.padding.left + scale.innerWidth}
                  y1={y}
                  y2={y}
                  stroke={rl.color ?? CHART_COLORS.moss}
                  strokeOpacity={0.55}
                  strokeWidth={1.2}
                  strokeDasharray={rl.dashed === false ? undefined : "5 4"}
                />
                {rl.label && (
                  <text
                    x={scale.padding.left + scale.innerWidth - 6}
                    y={y - 4}
                    textAnchor="end"
                    style={{
                      fontSize: 9,
                      fontFamily: "var(--font-mono, ui-monospace), monospace",
                      letterSpacing: "0.05em",
                      fontWeight: 700,
                      fill: rl.color ?? CHART_COLORS.moss,
                    }}
                  >
                    {rl.label}
                  </text>
                )}
              </g>
            );
          })}

          {gradient &&
            builtSeries.map((s, i) => (
              <ChartArea
                key={`area-${s.key}`}
                d={s.areaPath}
                color={s.color}
                gradientId={`kgrad-${uid}-${i}`}
                clipId={`kclip-${uid}-${i}`}
                width={width}
                height={height}
                animate={showAnim}
                reduceMotion={reduce}
                delay={0.15 + i * 0.08}
              />
            ))}

          {builtSeries.map((s, i) => (
            <ChartLine
              key={`line-${s.key}`}
              d={s.linePath}
              color={s.color}
              animate={showAnim}
              reduceMotion={reduce}
              delay={0.1 + i * 0.08}
              intense={isCinematic}
              strokeWidth={isCinematic ? 2.8 : 2.5}
            />
          ))}

          {showHeadOrb &&
            width >= 320 &&
            builtSeries.map((s, i) => {
              const last = s.coords[s.coords.length - 1];
              if (!last) return null;
              return (
                <HeadOrb
                  key={`orb-${s.key}`}
                  cx={last[0]}
                  cy={last[1]}
                  color={s.color}
                  animate={showAnim}
                  reduceMotion={reduce}
                  delay={1.2 + i * 0.08}
                  intense={isCinematic}
                />
              );
            })}

          {showAxis && (
            <AxisTicks
              scale={scale}
              formatY={formatY}
              formatX={formatX}
              animate={showAnim}
              reduceMotion={reduce}
              rawXValues={rawXValues}
            />
          )}

          {showTooltip && hoverPoint && (
            <TooltipCrosshair
              visible={hoverIndex != null}
              x={hoverX}
              y={hoverY}
              topY={scale.padding.top}
              bottomY={scale.padding.top + scale.innerHeight}
              color={builtSeries[0]?.color ?? color}
            />
          )}
        </svg>
      )}

      {showTooltip && hoverPoint && scale && (
        <TooltipBubble
          visible={hoverIndex != null}
          x={hoverX}
          y={hoverY}
          width={width}
        >
          {tooltipContent ? (
            tooltipContent(hoverPoint.raw, 0)
          ) : (
            <DefaultTooltipContent
              point={hoverPoint}
              series={normalized}
              hoverIndex={hoverIndex ?? 0}
              formatX={formatX}
              formatY={formatY}
              rawX={rawXValues[hoverIndex ?? 0]}
            />
          )}
        </TooltipBubble>
      )}
    </div>
  );
}

interface DefaultTooltipContentProps<T> {
  point: ChartPoint<T>;
  series: NormalizedSeries<T>[];
  hoverIndex: number;
  formatY?: (v: number) => string;
  formatX?: (v: unknown) => string;
  rawX: unknown;
}

function DefaultTooltipContent<T>({
  point,
  series,
  hoverIndex,
  formatY,
  formatX,
  rawX,
}: DefaultTooltipContentProps<T>) {
  const xLabel = formatX ? formatX(rawX ?? point.x) : `${rawX ?? point.x}`;
  const rawRow = point.raw as Record<string, unknown>;
  return (
    <div>
      <div
        className="font-mono text-[10px] uppercase tracking-wider"
        style={{ color: "var(--k-t3)" }}
      >
        {xLabel}
      </div>
      <div className="mt-1 flex flex-col gap-0.5">
        {series.map((s) => {
          const value = Number(rawRow[s.key as string] ?? 0);
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: s.color }}
              />
              <span
                className="font-display font-bold text-sm"
                style={{ color: "var(--text)" }}
              >
                {formatY ? formatY(value) : value}
              </span>
              {series.length > 1 && (
                <span className="text-[10px]" style={{ color: "var(--k-t3)" }}>
                  {s.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* hoverIndex referenced for hidden internal use */}
      <span style={{ display: "none" }}>{hoverIndex}</span>
    </div>
  );
}

export function KronosAreaChart<T extends Record<string, unknown>>(
  props: KronosLineChartProps<T>,
) {
  return <KronosLineChart {...props} gradient={props.gradient ?? true} />;
}
