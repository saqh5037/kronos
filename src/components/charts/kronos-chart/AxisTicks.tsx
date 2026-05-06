"use client";

import { motion } from "framer-motion";
import type { ChartScale } from "./useChartScale";

interface AxisTicksProps {
  scale: ChartScale;
  formatY?: (v: number) => string;
  formatX?: (v: unknown) => string;
  animate: boolean;
  reduceMotion: boolean;
  baseDelay?: number;
  rawXValues?: unknown[];
}

export function AxisTicks({
  scale,
  formatY,
  formatX,
  animate,
  reduceMotion,
  baseDelay = 0,
  rawXValues,
}: AxisTicksProps) {
  const { padding, innerHeight, yTicks, xTicks, yScale, xScale } = scale;
  const skipMotion = !animate || reduceMotion;

  return (
    <g aria-hidden="true" style={{ pointerEvents: "none" }}>
      {yTicks.map((tick, i) => {
        const y = yScale(tick);
        const label = formatY ? formatY(tick) : formatTickValue(tick);
        return (
          <motion.text
            key={`y-${i}`}
            x={padding.left - 8}
            y={y + 3}
            textAnchor="end"
            style={{
              fontSize: 10,
              fontFamily: "var(--font-mono, ui-monospace), monospace",
              letterSpacing: "0.04em",
              fill: "var(--text-3)",
            }}
            initial={skipMotion ? false : { opacity: 0, x: padding.left - 14 }}
            animate={{ opacity: 0.85, x: padding.left - 8 }}
            transition={
              skipMotion
                ? { duration: 0 }
                : {
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1],
                    delay: baseDelay + i * 0.05,
                  }
            }
          >
            {label}
          </motion.text>
        );
      })}
      {xTicks.map((tick, i) => {
        const x = xScale(tick);
        const rawValue = pickRawXForTick(rawXValues, tick, i, xTicks.length);
        const label = formatX ? formatX(rawValue ?? tick) : `${tick}`;
        return (
          <motion.text
            key={`x-${i}`}
            x={x}
            y={padding.top + innerHeight + 18}
            textAnchor={
              i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"
            }
            style={{
              fontSize: 10,
              fontFamily: "var(--font-mono, ui-monospace), monospace",
              letterSpacing: "0.04em",
              fill: "var(--text-3)",
            }}
            initial={
              skipMotion
                ? false
                : { opacity: 0, y: padding.top + innerHeight + 24 }
            }
            animate={{ opacity: 0.85, y: padding.top + innerHeight + 18 }}
            transition={
              skipMotion
                ? { duration: 0 }
                : {
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1],
                    delay: baseDelay + 0.4 + i * 0.05,
                  }
            }
          >
            {label}
          </motion.text>
        );
      })}
    </g>
  );
}

function formatTickValue(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  if (Number.isInteger(v)) return `${v}`;
  return v.toFixed(1);
}

function pickRawXForTick(
  rawXValues: unknown[] | undefined,
  numericValue: number,
  i: number,
  total: number,
): unknown {
  if (!rawXValues || !rawXValues.length) return numericValue;
  if (rawXValues.length === total) return rawXValues[i];
  // Fallback: closest by index proportion
  const idx = Math.round(
    (i / Math.max(1, total - 1)) * (rawXValues.length - 1),
  );
  return rawXValues[idx];
}
