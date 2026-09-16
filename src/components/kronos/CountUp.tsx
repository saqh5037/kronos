"use client";

import { useEffect, useRef, useState } from "react";
import { formatDecimal, formatMXN } from "@/lib/format";

interface CountUpProps {
  value: number;
  duration?: number;
  /** Number of decimals to display. Defaults to 0. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Set true to format as money in the house style (overrides `decimals`). */
  money?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function CountUp({
  value,
  duration = 900,
  decimals = 0,
  prefix = "",
  suffix = "",
  money = false,
  className,
  style,
}: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(t);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const formatted = money
    ? formatMXN(display)
    : formatDecimal(display, decimals);

  return (
    <span className={className} style={style}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
