import { describe, it, expect } from "vitest";
import {
  isDominusPromoActive,
  promoDaysLeft,
  PROMO_PLAN_SLUG,
  PROMO_EVENT_DATE,
} from "@/lib/dominus-promo";

describe("dominus-promo", () => {
  it("activa antes del 2026-05-23 23:59 CDMX", () => {
    expect(isDominusPromoActive(new Date("2026-05-08T12:00:00-06:00"))).toBe(
      true,
    );
    expect(isDominusPromoActive(new Date("2026-05-23T20:00:00-06:00"))).toBe(
      true,
    );
  });

  it("se desactiva post 2026-05-24 00:00 CDMX", () => {
    expect(isDominusPromoActive(new Date("2026-05-24T00:00:00-06:00"))).toBe(
      false,
    );
    expect(isDominusPromoActive(new Date("2026-06-15T12:00:00-06:00"))).toBe(
      false,
    );
  });

  it("promoDaysLeft devuelve días enteros restantes (ceil)", () => {
    expect(promoDaysLeft(new Date("2026-05-22T12:00:00-06:00"))).toBe(2);
    expect(promoDaysLeft(new Date("2026-05-23T12:00:00-06:00"))).toBe(1);
  });

  it("promoDaysLeft = 0 si la promo ya cerró", () => {
    expect(promoDaysLeft(new Date("2026-06-01T00:00:00-06:00"))).toBe(0);
  });

  it("constantes públicas estables", () => {
    expect(PROMO_PLAN_SLUG).toBe("dominus-founding");
    expect(PROMO_EVENT_DATE).toContain("23 de mayo");
  });
});
