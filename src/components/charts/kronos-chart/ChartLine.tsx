"use client";

import { motion, type Transition } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface ChartLineProps {
  d: string;
  color: string;
  strokeWidth?: number;
  glow?: boolean;
  /** Stronger glow stack for cinematic variant */
  intense?: boolean;
  animate: boolean;
  reduceMotion: boolean;
  delay?: number;
  duration?: number;
}

export function ChartLine({
  d,
  color,
  strokeWidth = 2.5,
  glow = true,
  intense = false,
  animate,
  reduceMotion,
  delay = 0,
  duration = 1.6,
}: ChartLineProps) {
  const ref = useRef<SVGPathElement | null>(null);
  const [pathLen, setPathLen] = useState<number | null>(null);
  const skipMotion = !animate || reduceMotion;

  useEffect(() => {
    if (skipMotion) {
      setPathLen(null);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const id = requestAnimationFrame(() => {
      try {
        const len = node.getTotalLength();
        if (Number.isFinite(len) && len > 0) setPathLen(len);
      } catch {
        // SVG path not ready (rare); skip animation gracefully
      }
    });
    return () => cancelAnimationFrame(id);
  }, [d, skipMotion]);

  const filter = glow
    ? intense
      ? `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 4px ${color}aa)`
      : `drop-shadow(0 0 6px ${color}66)`
    : undefined;

  if (skipMotion) {
    return (
      <path
        ref={ref}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter }}
      />
    );
  }

  if (pathLen == null) {
    return (
      <path
        ref={ref}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter, opacity: 0 }}
      />
    );
  }

  const transition: Transition = {
    duration,
    ease: [0.16, 1, 0.3, 1],
    delay,
  };

  return (
    <motion.path
      ref={ref}
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={pathLen}
      style={{ filter, willChange: "stroke-dashoffset" }}
      initial={{ strokeDashoffset: pathLen, opacity: 1 }}
      animate={{ strokeDashoffset: 0, opacity: 1 }}
      transition={transition}
    />
  );
}
