import { describe, it, expect } from "vitest";
import {
  formatTrendMagnitude,
  formatTrendValue,
  parseTrendValue,
  resolveTrend,
} from "@/components/kronos/trend-delta";

describe("resolveTrend — direction follows the number", () => {
  it("a negative delta is a down arrow painted danger", () => {
    const r = resolveTrend(-51.4, "percent");
    expect(r.direction).toBe("down");
    expect(r.tone).toBe("bad");
    expect(r.color).toBe("var(--k-danger)");
  });

  it("a positive delta is an up arrow painted lime", () => {
    const r = resolveTrend(12.4, "percent");
    expect(r.direction).toBe("up");
    expect(r.tone).toBe("good");
    expect(r.color).toBe("var(--k-accent)");
  });

  it("zero is neutral, never lime and never red", () => {
    const r = resolveTrend(0, "percent");
    expect(r.direction).toBe("flat");
    expect(r.tone).toBe("neutral");
    expect(r.color).toBe("var(--k-t2)");
  });

  it("does not crash on NaN or Infinity", () => {
    expect(resolveTrend(Number.NaN, "count").direction).toBe("flat");
    expect(resolveTrend(Number.POSITIVE_INFINITY, "money").tone).toBe(
      "neutral",
    );
  });
});

describe("resolveTrend — invert flips the tone, not the arrow", () => {
  it("churn going down is good news", () => {
    const r = resolveTrend(-8, "percent", true);
    expect(r.direction).toBe("down");
    expect(r.tone).toBe("good");
    expect(r.color).toBe("var(--k-accent)");
  });

  it("no-shows going up is bad news", () => {
    const r = resolveTrend(4, "count", true);
    expect(r.direction).toBe("up");
    expect(r.tone).toBe("bad");
    expect(r.color).toBe("var(--k-danger)");
  });

  it("invert leaves zero neutral", () => {
    expect(resolveTrend(0, "count", true).tone).toBe("neutral");
  });
});

describe("formatTrendValue — one formatter per kind", () => {
  it("percent uses the shared signed percentage", () => {
    expect(formatTrendValue(-51.4, "percent")).toBe("−51.4 %");
    expect(formatTrendValue(12.4, "percent")).toBe("+12.4 %");
  });

  it("money uses the shared signed MXN formatter", () => {
    expect(formatTrendValue(-147000, "money")).toBe("−$147,000 MXN");
    expect(formatTrendValue(1200, "money")).toBe("+$1,200 MXN");
  });

  it("count is a signed integer", () => {
    expect(formatTrendValue(-3, "count")).toBe("−3");
    expect(formatTrendValue(3, "count")).toBe("+3");
    expect(formatTrendValue(0, "count")).toBe("0");
  });
});

describe("aria-label is a Spanish sentence", () => {
  it("reads 'bajó 51.4 %' for the revenue bug from the audit", () => {
    expect(resolveTrend(-51.4, "percent").ariaLabel).toBe("bajó 51.4 %");
  });

  it("reads 'subió' for a gain", () => {
    expect(resolveTrend(12.4, "percent").ariaLabel).toBe("subió 12.4 %");
  });

  it("speaks money without a sign glyph", () => {
    expect(resolveTrend(-147000, "money").ariaLabel).toBe(
      "bajó $147,000 MXN",
    );
  });

  it("reads 'sin cambio' at zero", () => {
    expect(resolveTrend(0, "money").ariaLabel).toBe("sin cambio");
  });

  it("magnitude never carries a sign", () => {
    expect(formatTrendMagnitude(-3, "count")).toBe("3");
    expect(formatTrendMagnitude(-8.25, "percent")).toBe("8.3 %");
  });
});

describe("parseTrendValue — recovers numbers from the legacy string props", () => {
  it("reads a plain number through", () => {
    expect(parseTrendValue(-51.4)).toBe(-51.4);
  });

  it("reads an ASCII-minus percentage label", () => {
    expect(parseTrendValue("-51.4%")).toBe(-51.4);
  });

  it("reads a true-minus percentage label", () => {
    expect(parseTrendValue("−51.4 %")).toBe(-51.4);
  });

  it("reads a money label with thousands separators and trailing prose", () => {
    expect(parseTrendValue("-$147,000 vs período anterior")).toBe(-147000);
  });

  it("reads a positive label", () => {
    expect(parseTrendValue("+12.4 %")).toBe(12.4);
  });

  it("returns null when there is nothing numeric", () => {
    expect(parseTrendValue("—")).toBeNull();
    expect(parseTrendValue(undefined)).toBeNull();
    expect(parseTrendValue(Number.NaN)).toBeNull();
  });
});
