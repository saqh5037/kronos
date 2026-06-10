"use client";

import { m } from "framer-motion";
import type { ChartScale } from "./useChartScale";

interface ChartGridProps {
  scale: ChartScale;
  animate: boolean;
  reduceMotion: boolean;
  baseDelay?: number;
  /** Cinematic variant: tighter grid, brighter lima lines */
  cinematic?: boolean;
  cinematicColor?: string;
}

export function ChartGrid({
  scale,
  animate,
  reduceMotion,
  baseDelay = 0,
  cinematic = false,
  cinematicColor = "#C8FF2D",
}: ChartGridProps) {
  const { padding, innerWidth, innerHeight, yTicks, yScale } = scale;
  const x1 = padding.left;
  const x2 = padding.left + innerWidth;
  const yTop = padding.top;
  const yBottom = padding.top + innerHeight;

  const targetOpacity = cinematic ? 0.32 : 0.22;
  const stroke = cinematic ? cinematicColor : "currentColor";
  const dash = cinematic ? "2 6" : "3 4";

  // Vertical lines for cinematic grid (tighter, more cells)
  const verticalCount = cinematic ? 12 : 0;
  const verticalLines = Array.from({ length: verticalCount + 1 }, (_, i) => {
    const x = padding.left + (innerWidth * i) / verticalCount;
    return { x, i };
  });

  return (
    <g aria-hidden="true">
      {yTicks.map((tick, i) => {
        const y = yScale(tick);
        return (
          <m.line
            key={`grid-${i}`}
            x1={x1}
            x2={x2}
            y1={y}
            y2={y}
            stroke={stroke}
            strokeWidth={1}
            strokeDasharray={dash}
            style={{
              color: "var(--k-t3)",
              pointerEvents: "none",
              transformOrigin: `${x1}px ${y}px`,
            }}
            initial={
              animate && !reduceMotion ? { opacity: 0, scaleX: 0.96 } : false
            }
            animate={{ opacity: targetOpacity, scaleX: 1 }}
            transition={
              animate && !reduceMotion
                ? {
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                    delay: baseDelay + i * 0.06,
                  }
                : { duration: 0 }
            }
          />
        );
      })}
      {cinematic &&
        verticalLines.map(({ x, i }) => (
          <m.line
            key={`vgrid-${i}`}
            x1={x}
            x2={x}
            y1={yTop}
            y2={yBottom}
            stroke={cinematicColor}
            strokeWidth={1}
            strokeDasharray={dash}
            style={{
              pointerEvents: "none",
              transformOrigin: `${x}px ${yTop}px`,
            }}
            initial={
              animate && !reduceMotion ? { opacity: 0, scaleY: 0.96 } : false
            }
            animate={{ opacity: targetOpacity * 0.6, scaleY: 1 }}
            transition={
              animate && !reduceMotion
                ? {
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                    delay: baseDelay + i * 0.04,
                  }
                : { duration: 0 }
            }
          />
        ))}
    </g>
  );
}
