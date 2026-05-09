import { describe, it, expect } from "vitest";
import {
  STANDARD_MOVEMENTS,
  STANDARD_MOVEMENTS_COUNT,
  WOD_LIBRARY,
  DEFAULT_BENCHMARK_SLUGS,
} from "@/server/seed-defaults";

describe("seed-defaults · STANDARD_MOVEMENTS", () => {
  it("tiene al menos 50 movimientos canónicos", () => {
    expect(STANDARD_MOVEMENTS.length).toBeGreaterThanOrEqual(50);
    expect(STANDARD_MOVEMENTS_COUNT).toBe(STANDARD_MOVEMENTS.length);
  });

  it("todos los slugs son únicos", () => {
    const slugs = STANDARD_MOVEMENTS.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("los movimientos referenciados por WOD_LIBRARY existen como nombres en STANDARD_MOVEMENTS", () => {
    const movementNames = new Set(STANDARD_MOVEMENTS.map((m) => m.name));
    const referenced = WOD_LIBRARY.flatMap((w) =>
      w.movements.map((mv) => mv.name),
    );
    const missing = Array.from(new Set(referenced)).filter(
      (n) => !movementNames.has(n),
    );
    expect(missing).toEqual([]);
  });

  it("cada movimiento tiene name no vacío y category válida", () => {
    for (const mv of STANDARD_MOVEMENTS) {
      expect(mv.name.trim().length).toBeGreaterThan(0);
      expect(mv.slug.trim().length).toBeGreaterThan(0);
      expect(mv.category).toBeDefined();
    }
  });
});

describe("seed-defaults · WOD_LIBRARY", () => {
  it("tiene al menos 20 WODs benchmark", () => {
    expect(WOD_LIBRARY.length).toBeGreaterThanOrEqual(20);
  });

  it("todos los slugs son únicos", () => {
    const slugs = WOD_LIBRARY.map((w) => w.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("incluye los benchmarks clásicos (Fran, Helen, Cindy, Murph, Annie)", () => {
    const slugs = new Set(WOD_LIBRARY.map((w) => w.slug));
    for (const expected of ["fran", "helen", "cindy", "murph", "annie"]) {
      expect(slugs.has(expected)).toBe(true);
    }
  });

  it("cada WOD tiene name, type, scoreType, description y movements no vacíos", () => {
    for (const wod of WOD_LIBRARY) {
      expect(wod.name.trim().length).toBeGreaterThan(0);
      expect(wod.type).toBeDefined();
      expect(wod.scoreType).toBeDefined();
      expect(wod.description.trim().length).toBeGreaterThan(0);
      expect(wod.movements.length).toBeGreaterThan(0);
    }
  });
});

describe("seed-defaults · DEFAULT_BENCHMARK_SLUGS", () => {
  it("son subconjunto de WOD_LIBRARY", () => {
    const lib = new Set(WOD_LIBRARY.map((w) => w.slug));
    for (const slug of DEFAULT_BENCHMARK_SLUGS) {
      expect(lib.has(slug)).toBe(true);
    }
  });

  it("contiene exactamente los 5 más populares", () => {
    expect([...DEFAULT_BENCHMARK_SLUGS].sort()).toEqual(
      ["fran", "helen", "cindy", "murph", "annie"].sort(),
    );
  });
});
