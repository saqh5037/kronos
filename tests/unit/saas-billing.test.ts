import { describe, it, expect, afterEach } from "vitest";
import {
  formatPriceMxn,
  describePlanLimits,
  describeFeatures,
  isMockMode,
  nextBillingDate,
} from "@/lib/saas-billing";

describe("formatPriceMxn", () => {
  it("formatea 0 como 'Gratis'", () => {
    expect(formatPriceMxn(0)).toBe("Gratis");
  });

  it("formatea 49900 cents como '$499 MXN'", () => {
    expect(formatPriceMxn(49900)).toBe("$499 MXN");
  });

  it("formatea 99900 cents como '$999 MXN'", () => {
    expect(formatPriceMxn(99900)).toBe("$999 MXN");
  });

  it("formatea precios > 1000 con separador de miles", () => {
    expect(formatPriceMxn(125000)).toMatch(/^\$1[.,]?250 MXN$/);
  });
});

describe("describePlanLimits", () => {
  it("describe límites finitos", () => {
    expect(describePlanLimits({ maxAthletes: 5, maxCoaches: 1 })).toEqual([
      "Hasta 5 atletas",
      "Hasta 1 coaches",
    ]);
  });

  it("describe ilimitados con maxAthletes = null", () => {
    expect(describePlanLimits({ maxAthletes: null, maxCoaches: 5 })).toEqual([
      "Atletas ilimitados",
      "Hasta 5 coaches",
    ]);
  });

  it("ambos ilimitados", () => {
    expect(describePlanLimits({ maxAthletes: null, maxCoaches: null })).toEqual(
      ["Atletas ilimitados", "Coaches ilimitados"],
    );
  });
});

describe("describeFeatures", () => {
  it("solo features true se listan", () => {
    expect(
      describeFeatures({
        bookings: true,
        wods: true,
        leaderboard: false,
        analytics: false,
        ocr: false,
        ai: false,
      }),
    ).toEqual(["Reservas + roster", "Biblioteca de WODs"]);
  });

  it("plan Premium incluye todas", () => {
    expect(
      describeFeatures({
        bookings: true,
        wods: true,
        leaderboard: true,
        analytics: true,
        ocr: true,
        ai: true,
      }).length,
    ).toBe(6);
  });

  it("plan Free básico", () => {
    expect(
      describeFeatures({
        bookings: true,
        wods: true,
        leaderboard: true,
        analytics: false,
        ocr: false,
        ai: false,
      }),
    ).toContain("Reservas + roster");
    expect(
      describeFeatures({
        bookings: true,
        wods: true,
        leaderboard: true,
        analytics: false,
        ocr: false,
        ai: false,
      }),
    ).not.toContain("Insights con IA");
  });
});

describe("isMockMode", () => {
  const original = process.env.MERCADOPAGO_ACCESS_TOKEN;
  afterEach(() => {
    if (original === undefined) {
      delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    } else {
      process.env.MERCADOPAGO_ACCESS_TOKEN = original;
    }
  });

  it("true cuando MERCADOPAGO_ACCESS_TOKEN está vacío", () => {
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    expect(isMockMode()).toBe(true);
  });

  it("false cuando MERCADOPAGO_ACCESS_TOKEN está cableado", () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-fake-token-123";
    expect(isMockMode()).toBe(false);
  });
});

describe("nextBillingDate", () => {
  it("default: agrega 1 mes a la fecha base", () => {
    const base = new Date("2026-05-06T12:00:00Z");
    const next = nextBillingDate(base);
    expect(next.getUTCMonth()).toBe(5); // junio
    expect(next.getUTCDate()).toBe(6);
  });

  it("rollover de año: diciembre → enero", () => {
    const base = new Date("2026-12-15T12:00:00Z");
    const next = nextBillingDate(base);
    expect(next.getUTCFullYear()).toBe(2027);
    expect(next.getUTCMonth()).toBe(0); // enero
  });
});
