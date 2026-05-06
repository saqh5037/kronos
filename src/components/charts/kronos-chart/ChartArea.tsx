"use client";

import { motion } from "framer-motion";

interface ChartAreaProps {
  d: string;
  color: string;
  gradientId: string;
  clipId: string;
  width: number;
  height: number;
  animate: boolean;
  reduceMotion: boolean;
  delay?: number;
  duration?: number;
}

export function ChartArea({
  d,
  color,
  gradientId,
  clipId,
  width,
  height,
  animate,
  reduceMotion,
  delay = 0.15,
  duration = 1.4,
}: ChartAreaProps) {
  const skipMotion = !animate || reduceMotion;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.42} />
          <stop offset="55%" stopColor={color} stopOpacity={0.14} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <clipPath id={clipId}>
          <motion.rect
            x={0}
            y={0}
            height={height}
            initial={skipMotion ? { width } : { width: 0 }}
            animate={{ width }}
            transition={
              skipMotion
                ? { duration: 0 }
                : { duration, ease: [0.16, 1, 0.3, 1], delay }
            }
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path d={d} fill={`url(#${gradientId})`} />
      </g>
    </>
  );
}
