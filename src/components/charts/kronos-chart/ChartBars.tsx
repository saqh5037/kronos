"use client";

import { motion } from "framer-motion";

interface BarSpec {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ChartBarsProps {
  bars: BarSpec[];
  color: string;
  baselineY: number;
  gradientId: string;
  animate: boolean;
  reduceMotion: boolean;
  baseDelay?: number;
}

export function ChartBars({
  bars,
  color,
  baselineY,
  gradientId,
  animate,
  reduceMotion,
  baseDelay = 0.2,
}: ChartBarsProps) {
  const skipMotion = !animate || reduceMotion;

  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.85} />
          <stop offset="55%" stopColor={color} stopOpacity={0.5} />
          <stop offset="100%" stopColor={color} stopOpacity={0.08} />
        </linearGradient>
      </defs>
      {bars.map((b, i) => {
        const initialProps = skipMotion
          ? {}
          : {
              initial: { scaleY: 0, opacity: 0 },
              animate: { scaleY: 1, opacity: 1 },
              transition: {
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                delay: baseDelay + i * 0.06,
              },
            };
        return (
          <motion.rect
            key={`bar-${i}`}
            x={b.x}
            y={b.y}
            width={b.width}
            height={b.height}
            rx={2.5}
            ry={2.5}
            fill={`url(#${gradientId})`}
            stroke={color}
            strokeOpacity={0.55}
            strokeWidth={0.8}
            style={{
              transformOrigin: `${b.x + b.width / 2}px ${baselineY}px`,
              transformBox: "fill-box",
              filter: `drop-shadow(0 0 4px ${color}55)`,
            }}
            {...initialProps}
          />
        );
      })}
    </g>
  );
}

export type { BarSpec };
