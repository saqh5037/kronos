import { describe, expect, it } from "vitest";
import {
  getStrategy,
  hasStrategy,
  listStrategies,
  listStrategySlugs,
} from "@/lib/disciplines/registry";
import { CrossfitStrategy } from "@/lib/disciplines/crossfit";
import { HyroxStrategy } from "@/lib/disciplines/hyrox";

describe("disciplines registry", () => {
  describe("getStrategy", () => {
    it("devuelve CrossfitStrategy para slug=crossfit", () => {
      expect(getStrategy("crossfit")).toBe(CrossfitStrategy);
    });

    it("devuelve HyroxStrategy para slug=hyrox", () => {
      expect(getStrategy("hyrox")).toBe(HyroxStrategy);
    });

    it("lanza error para slug desconocido (yoga aún no registrado)", () => {
      expect(() => getStrategy("yoga")).toThrow(/yoga/);
      expect(() => getStrategy("yoga")).toThrow(/Disponibles/);
    });

    it("error message lista las disciplinas registradas", () => {
      try {
        getStrategy("invalid");
        expect.fail("debió lanzar");
      } catch (err) {
        expect((err as Error).message).toContain("crossfit");
        expect((err as Error).message).toContain("hyrox");
      }
    });
  });

  describe("hasStrategy", () => {
    it("true para registradas", () => {
      expect(hasStrategy("crossfit")).toBe(true);
      expect(hasStrategy("hyrox")).toBe(true);
    });

    it("false para no registradas", () => {
      expect(hasStrategy("yoga")).toBe(false);
      expect(hasStrategy("pilates")).toBe(false);
      expect(hasStrategy("invalid")).toBe(false);
    });
  });

  describe("listStrategies + listStrategySlugs", () => {
    it("listStrategies devuelve las 2 registradas en MVP", () => {
      const all = listStrategies();
      expect(all).toHaveLength(2);
      expect(all).toContain(CrossfitStrategy);
      expect(all).toContain(HyroxStrategy);
    });

    it("listStrategySlugs devuelve slugs", () => {
      const slugs = listStrategySlugs();
      expect(slugs).toEqual(expect.arrayContaining(["crossfit", "hyrox"]));
    });
  });

  describe("contract uniformity (every strategy implements DisciplineStrategy)", () => {
    it.each(listStrategies())(
      "strategy $slug tiene todos los métodos requeridos",
      (strategy) => {
        expect(typeof strategy.slug).toBe("string");
        expect(Array.isArray(strategy.supportedMeasurements)).toBe(true);
        expect(Array.isArray(strategy.supportedSessionTypes)).toBe(true);
        expect(typeof strategy.validateSessionPayload).toBe("function");
        expect(typeof strategy.validateScorePayload).toBe("function");
        expect(typeof strategy.formatScore).toBe("function");
        expect(typeof strategy.detectPR).toBe("function");
        expect(typeof strategy.isBetterScore).toBe("function");
        expect(["PR", "STREAK", "CONSISTENCY"]).toContain(
          strategy.leaderboardSortKey,
        );
      },
    );
  });
});
