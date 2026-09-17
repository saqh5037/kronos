/**
 * Y-axis domain helper shared by the custom SVG chart kit (audit 2026-09-15,
 * "Crecimiento" finding: a 40→52 truncated axis exaggerating growth).
 *
 * Rule: counts and money floor at 0 so bar and area height stays proportional to
 * the value. Only pass `zeroFloor: false` for a series that genuinely lives away
 * from zero (body weight, a 1RM in kg) where a zero baseline destroys the signal.
 */

export interface YDomainOptions {
  /** Clamp the low end to 0 when the data has no negatives. Default true. */
  zeroFloor?: boolean;
  /** Head/foot room as a fraction of the value range. Default 0.14. */
  pad?: number;
  /** Tick count used for the "nice" rounding. Default 5. */
  tickCount?: number;
  /** Round the domain to human numbers. Default true. */
  nice?: boolean;
}

export interface YDomain {
  min: number;
  max: number;
}

/** Round a [min, max] pair outwards to human-friendly step boundaries. */
export function niceDomain(
  min: number,
  max: number,
  tickCount: number,
): { min: number; max: number; step: number } {
  const range = max - min;
  if (range === 0) return { min, max: max + 1, step: 1 };
  const rough = range / Math.max(1, tickCount - 1);
  const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / pow10;
  let step: number;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  step *= pow10;
  return {
    min: Math.floor(min / step) * step,
    max: Math.ceil(max / step) * step,
    step,
  };
}

export function computeYDomain(
  values: number[],
  options: YDomainOptions = {},
): YDomain {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return { min: 0, max: 1 };

  const zeroFloor = options.zeroFloor !== false;
  const nice = options.nice !== false;
  const padFraction = options.pad ?? 0.14;
  const tickCount = options.tickCount ?? 5;

  const dataMin = Math.min(...finite);
  const dataMax = Math.max(...finite);

  const range = dataMax - dataMin || Math.max(1, Math.abs(dataMax) * 0.1);
  const pad = range * padFraction;

  let min = dataMin - pad;
  let max = dataMax + pad;

  // A count or money series never dips below zero, so neither should its axis.
  if (zeroFloor && dataMin >= 0) min = 0;

  if (nice) {
    const niced = niceDomain(min, max, tickCount);
    min = zeroFloor && dataMin >= 0 ? 0 : niced.min;
    max = niced.max;
  }

  if (min === max) max = min + 1;
  return { min, max };
}

/** Recharts-shaped domain for counts and money: `[0, "auto"]`. */
export const ZERO_FLOOR_DOMAIN: [number, "auto"] = [0, "auto"];
