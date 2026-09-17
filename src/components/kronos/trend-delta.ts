/**
 * Pure resolution logic for `<TrendDelta/>` (audit 2026-09-15, systemic issue S2).
 *
 * The dashboard bug this fixes: a −51.4 % revenue delta rendered in lime with an
 * up-caret. Direction and tone are now derived from the number, never chosen by
 * the caller, and `invert` flips the tone (not the arrow) for metrics where down
 * is the good news (churn, no-shows).
 *
 * Framework-free on purpose so it can be unit-tested without a DOM.
 */
import {
  formatInt,
  formatMXN,
  formatMXNDelta,
  formatPercentDelta,
} from "@/lib/format";

export type TrendKind = "percent" | "money" | "count";
export type TrendDirection = "up" | "down" | "flat";
export type TrendTone = "good" | "bad" | "neutral";

export interface TrendResolution {
  /** Sign of the change. Always follows the number, never `invert`. */
  direction: TrendDirection;
  /** Whether the change is good news for this metric. `invert` flips it. */
  tone: TrendTone;
  /** Token to paint the pill with. */
  color: string;
  /** Signed, formatted text ("−51.4 %", "+$1,200 MXN", "+3"). */
  text: string;
  /** Spanish sentence for assistive tech ("bajó 51.4 %"). */
  ariaLabel: string;
}

const TONE_COLOR: Record<TrendTone, string> = {
  good: "var(--k-accent)",
  bad: "var(--k-danger)",
  neutral: "var(--k-t2)",
};

/** Signed, formatted delta text for a kind. */
export function formatTrendValue(value: number, kind: TrendKind): string {
  if (kind === "money") return formatMXNDelta(value);
  if (kind === "percent") return formatPercentDelta(value);
  const sign = value < 0 ? "−" : value > 0 ? "+" : "";
  return `${sign}${formatInt(Math.abs(value))}`;
}

/** Unsigned magnitude, for the spoken label. */
export function formatTrendMagnitude(value: number, kind: TrendKind): string {
  const abs = Math.abs(value);
  if (kind === "money") return formatMXN(abs);
  if (kind === "percent") return `${abs.toFixed(1)} %`;
  return formatInt(abs);
}

export function resolveTrend(
  value: number,
  kind: TrendKind,
  invert = false,
): TrendResolution {
  const safe = Number.isFinite(value) ? value : 0;
  const direction: TrendDirection =
    safe > 0 ? "up" : safe < 0 ? "down" : "flat";

  let tone: TrendTone;
  if (direction === "flat") tone = "neutral";
  else if (direction === "up") tone = invert ? "bad" : "good";
  else tone = invert ? "good" : "bad";

  const text = formatTrendValue(safe, kind);
  const ariaLabel =
    direction === "flat"
      ? "sin cambio"
      : `${direction === "up" ? "subió" : "bajó"} ${formatTrendMagnitude(
          safe,
          kind,
        )}`;

  return { direction, tone, color: TONE_COLOR[tone], text, ariaLabel };
}

/**
 * Accepts the legacy pre-formatted delta strings the admin dashboard page still
 * passes ("+12.4%", "−51.4 %", "-$147,000 vs período anterior") and recovers the
 * signed number so `<TrendDelta/>` can decide direction and tone itself.
 * Returns `null` when nothing numeric can be read.
 */
export function parseTrendValue(
  raw: number | string | undefined | null,
): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;

  const normalized = raw.replace(/−/g, "-").replace(/ /g, " ");
  const match = normalized.match(/\d[\d,]*(?:\.\d+)?/);
  if (!match) return null;

  // The sign can sit behind a currency symbol ("-$147,000"), so read it from
  // everything that precedes the first digit rather than from the digits' prefix.
  const negative = normalized.slice(0, match.index ?? 0).includes("-");
  const parsed = Number(match[0].replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return null;
  return negative ? -parsed : parsed;
}
