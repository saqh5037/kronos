"use client";

/**
 * The only way to render a metric delta in Kronos (audit 2026-09-15, S2).
 *
 * It refuses to show red news in green: the arrow and the colour come from the
 * sign of `value`, not from the caller. `invert` marks metrics where down is the
 * good news (churn, no-shows, morosos) — it flips the colour, never the arrow.
 */
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { resolveTrend, type TrendKind } from "./trend-delta";

export interface TrendDeltaProps {
  value: number;
  kind: TrendKind;
  /** Down is good for this metric (churn, no-shows). */
  invert?: boolean;
  /** Extra context spoken after the direction ("vs período anterior"). */
  context?: string;
  size?: 12 | 14 | 16;
  className?: string;
}

export function TrendDelta({
  value,
  kind,
  invert = false,
  context,
  size = 14,
  className,
}: TrendDeltaProps) {
  const trend = resolveTrend(value, kind, invert);
  const Arrow =
    trend.direction === "up"
      ? ArrowUp
      : trend.direction === "down"
        ? ArrowDown
        : Minus;
  const ariaLabel = context
    ? `${trend.ariaLabel} ${context}`
    : trend.ariaLabel;

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      title={ariaLabel}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontFamily: "var(--k-font-display)",
        fontSize: size,
        fontWeight: 600,
        fontFeatureSettings: '"tnum" 1',
        color: trend.color,
        whiteSpace: "nowrap",
      }}
    >
      <Arrow
        width={size}
        height={size}
        strokeWidth={2.25}
        aria-hidden
        focusable={false}
      />
      <span aria-hidden>{trend.text}</span>
    </span>
  );
}

export default TrendDelta;
