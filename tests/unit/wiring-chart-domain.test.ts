/**
 * The y-axis floor, from the option a chart declares to the domain it gets
 * (audit 2026-09-15, "Crecimiento": a 40-to-52 axis that made a 30 % rise read
 * as a tenfold one).
 *
 * `useChartScale` is a hook, so what is pinned here is the contract it forwards
 * to `computeYDomain` — the same `zeroFloor` flag, with the same default — plus
 * the Recharts-shaped constant the bar charts use. A regression in either the
 * default or the opt-out shows up here rather than on a screenshot.
 */
import { describe, it, expect } from "vitest";
import {
  computeYDomain,
  ZERO_FLOOR_DOMAIN,
  type YDomainOptions,
} from "@/components/charts/domain";

/**
 * Exactly what `useChartScale` passes through (see `useChartScale.ts`): the
 * flag defaults to ON, and only an explicit `false` turns it off.
 */
function domainFor(values: number[], options: { zeroFloor?: boolean } = {}) {
  const forwarded: YDomainOptions = {
    zeroFloor: options.zeroFloor !== false,
    pad: 0.14,
    tickCount: 5,
    nice: true,
  };
  return computeYDomain(values, forwarded);
}

describe("chart y-domain wiring", () => {
  it("floors money at zero by default, so bar height stays proportional", () => {
    expect(domainFor([138750, 214000]).min).toBe(0);
  });

  it("floors a count series at zero even when it never approaches it", () => {
    // The exact series from the audit finding.
    expect(domainFor([40, 44, 48, 52]).min).toBe(0);
  });

  it("keeps the top above the data so the peak is not clipped", () => {
    const d = domainFor([40, 44, 48, 52]);
    expect(d.max).toBeGreaterThanOrEqual(52);
  });

  it("opts out only on an explicit false, for a series that lives away from zero", () => {
    // Body weight in kg: a zero baseline destroys the signal.
    const d = domainFor([78.2, 79.1, 80.4], { zeroFloor: false });
    expect(d.min).toBeGreaterThan(0);
  });

  it("treats an omitted flag as floored, never as opted out", () => {
    expect(domainFor([78.2, 79.1, 80.4]).min).toBe(0);
  });

  it("still allows a negative floor when the data really goes negative", () => {
    expect(domainFor([-5, 10]).min).toBeLessThan(0);
  });

  it("never returns a collapsed domain for an all-zero series", () => {
    const d = domainFor([0, 0, 0]);
    expect(d.max).toBeGreaterThan(d.min);
  });

  it("survives an empty series without producing NaN", () => {
    const d = domainFor([]);
    expect(Number.isFinite(d.min)).toBe(true);
    expect(Number.isFinite(d.max)).toBe(true);
  });

  it("exposes a zero-floored Recharts domain for counts and money", () => {
    expect(ZERO_FLOOR_DOMAIN).toEqual([0, "auto"]);
  });
});
