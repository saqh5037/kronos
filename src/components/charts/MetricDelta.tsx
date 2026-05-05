import { cn } from "@/lib/utils";

type Props = {
  current: number;
  previous: number;
  /** "higher" → up is good (revenue, attendance). "lower" → down is good (no-shows, churn). */
  goodWhen?: "higher" | "lower";
  formatter?: (value: number) => string;
  className?: string;
  showSign?: boolean;
};

export function MetricDelta({
  current,
  previous,
  goodWhen = "higher",
  formatter,
  className,
  showSign = true,
}: Props) {
  const delta = current - previous;
  const pct =
    previous === 0
      ? current === 0
        ? 0
        : 100
      : (delta / Math.abs(previous)) * 100;

  const direction = delta === 0 ? "flat" : delta > 0 ? "up" : "down";
  const isGood =
    direction === "flat"
      ? null
      : goodWhen === "higher"
        ? direction === "up"
        : direction === "down";

  const tone = isGood === null ? "ghost" : isGood ? "recovery" : "pr";

  const arrow = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
  const value = formatter
    ? formatter(Math.abs(delta))
    : Math.abs(delta).toString();
  const pctStr = `${showSign && delta > 0 ? "+" : delta < 0 ? "−" : ""}${Math.abs(pct).toFixed(1)}%`;

  return (
    <span
      className={cn(
        "k-chip",
        tone === "recovery" && "k-chip-moss",
        tone === "pr" && "k-chip-ember",
        tone === "ghost" && "k-chip-ghost",
        className,
      )}
      title={`Δ ${value} vs período anterior`}
    >
      <span aria-hidden>{arrow}</span>
      <span>{pctStr}</span>
    </span>
  );
}
