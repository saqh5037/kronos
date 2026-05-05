"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  duration?: number;
  /** Number of decimals to display. Defaults to 0. */
  decimals?: number;
  /** Locale used for thousand separators. Defaults to "es-MX". */
  locale?: string;
  prefix?: string;
  suffix?: string;
  /** Set true to format as currency MXN (overrides decimals/locale). */
  money?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const moneyFmt = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export default function CountUp({
  value,
  duration = 900,
  decimals = 0,
  locale = "es-MX",
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
    ? moneyFmt.format(display)
    : display.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

  return (
    <span className={className} style={style}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
