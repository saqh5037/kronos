"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

type Props = {
  /** Target number to count to. */
  to: number;
  /** Optional prefix (e.g. "$", "↑"). */
  prefix?: string;
  /** Optional suffix (e.g. "%", "K", "M"). */
  suffix?: string;
  /** Decimal places. Defaults to 0. */
  decimals?: number;
  /** Animation duration in seconds. Defaults to 1.6. */
  duration?: number;
  /** Custom number formatter (locale, separator). */
  format?: (value: number) => string;
};

/**
 * CountUp — anima el número desde 0 hasta `to` cuando entra al viewport.
 *
 * Usa framer-motion `animate()` con easing easeOut. Solo dispara una vez por
 * mount (no se reseteta al re-entrar). Respeta `prefers-reduced-motion`: si
 * el usuario lo tiene activado, salta directo al valor final sin animación.
 */
export default function CountUp({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.6,
  format,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  // Always start at 0 in SSR + first client render to avoid hydration mismatch.
  // useEffect handles the post-mount jump (reduce motion) or animation kickoff.
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const triggerAnimation = () => {
      if (reduce) {
        setValue(to);
        return null;
      }
      return animate(0, to, {
        duration,
        ease: "easeOut",
        onUpdate(v) {
          setValue(v);
        },
      });
    };

    // Native IntersectionObserver (more reliable than framer's useInView in
    // some animated parent contexts). Fires once when 10% visible.
    let controls: ReturnType<typeof animate> | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            controls = triggerAnimation();
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      controls?.stop();
    };
  }, [to, duration, reduce]);

  const formatted = format
    ? format(value)
    : decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString("es-MX");

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
