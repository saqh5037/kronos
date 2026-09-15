"use client";

import { TrendDelta } from "@/components/kronos/TrendDelta";

type Props = {
  current: number;
  previous: number;
  /** "higher" → up is good (revenue, attendance). "lower" → down is good (no-shows, churn). */
  goodWhen?: "higher" | "lower";
  className?: string;
  /**
   * @deprecated The pill renders a signed percentage through the shared
   * formatters now, so a per-call-site formatter can no longer disagree with the
   * rest of admin. Accepted so existing call sites keep compiling; ignored.
   */
  formatter?: (value: number) => string;
  /** @deprecated The sign always shows; it is the whole point. Ignored. */
  showSign?: boolean;
};

/**
 * Current-vs-previous convenience wrapper over `<TrendDelta/>`: it does the
 * percentage arithmetic and hands the signed number over, so direction, colour
 * and the Spanish aria-label all come from one place.
 */
export function MetricDelta({
  current,
  previous,
  goodWhen = "higher",
  className,
}: Props) {
  const delta = current - previous;
  const pct =
    previous === 0
      ? current === 0
        ? 0
        : 100
      : (delta / Math.abs(previous)) * 100;

  return (
    <TrendDelta
      value={pct}
      kind="percent"
      invert={goodWhen === "lower"}
      context="vs período anterior"
      size={12}
      className={className}
    />
  );
}
