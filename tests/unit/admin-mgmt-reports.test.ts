/**
 * Reportes period + readiness labelling (audit 2026-09-15, S3/S4).
 *
 * The header printed "Septiembre De 2026" and the readiness tile led with
 * "100 %" built on a single answer out of 42.
 */
import { describe, it, expect } from "vitest";
import {
  READINESS_MIN_RESPONSE_RATE,
  hasEnoughReadinessData,
  monthYearLabel,
  responseCountLabel,
  responseRate,
  rollingMonthsLabel,
} from "@/app/admin/reportes/_lib/period-label";

describe("monthYearLabel", () => {
  it("renders 'septiembre 2026' — no preposition, no title case", () => {
    expect(monthYearLabel(new Date("2026-09-15T18:00:00.000Z"))).toBe(
      "septiembre 2026",
    );
  });

  it("never contains ' de '", () => {
    for (let m = 0; m < 12; m++) {
      const label = monthYearLabel(new Date(Date.UTC(2026, m, 15, 18)));
      expect(label).not.toMatch(/\sde\s/i);
      expect(label).toMatch(/^[a-záéíóúñ]+ \d{4}$/);
    }
  });
});

describe("rollingMonthsLabel", () => {
  it("pluralises", () => {
    expect(rollingMonthsLabel(12)).toBe("Últimos 12 meses");
    expect(rollingMonthsLabel(1)).toBe("Últimos 1 mes");
  });
});

describe("responseRate", () => {
  it("is a share of the surveyed group", () => {
    expect(responseRate(1, 42)).toBeCloseTo(1 / 42);
    expect(responseRate(21, 42)).toBe(0.5);
  });

  it("is null when nobody was surveyed — not 0 %", () => {
    expect(responseRate(0, 0)).toBeNull();
  });
});

describe("hasEnoughReadinessData", () => {
  it("rejects a box-wide number built on 1 of 42", () => {
    expect(hasEnoughReadinessData(1, 42)).toBe(false);
  });

  it("accepts at or above the threshold", () => {
    const answered = Math.ceil(42 * READINESS_MIN_RESPONSE_RATE);
    expect(hasEnoughReadinessData(answered, 42)).toBe(true);
  });

  it("rejects an empty survey", () => {
    expect(hasEnoughReadinessData(0, 0)).toBe(false);
  });

  it("uses a 20 % floor", () => {
    expect(READINESS_MIN_RESPONSE_RATE).toBe(0.2);
  });
});

describe("responseCountLabel", () => {
  it("leads with the sample, in Spanish", () => {
    expect(responseCountLabel(1, 42)).toBe("1 de 42 respondió");
    expect(responseCountLabel(9, 42)).toBe("9 de 42 respondieron");
    expect(responseCountLabel(0, 42)).toBe("0 de 42 respondieron");
  });
});
