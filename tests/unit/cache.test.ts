/**
 * src/server/cache.ts — wrappers unstable_cache + revalidateTag.
 *
 * Estrategia: `unstable_cache` se mockea pass-through (devuelve la fn tal cual)
 * para que los tests verifiquen que (a) la query subyacente arma argumentos
 * correctos y (b) `revalidateTag` se llama con los tags esperados al invalidar.
 *
 * No probamos el behavior real del cache (eso lo prueba Next.js); probamos
 * nuestro contrato de wrappers.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  boxFindUnique,
  membershipFindMany,
  revalidateTagMock,
  unstableCacheConfigs,
} = vi.hoisted(() => ({
  boxFindUnique: vi.fn(),
  membershipFindMany: vi.fn(),
  revalidateTagMock: vi.fn(),
  // Captura la config (key + options) con la que cada call wrapper invoca
  // unstable_cache. Nos deja verificar que los tags granulares por boxId/
  // athleteId SÍ se registran (regresión del bug F1.5 fix 2026-05-16).
  unstableCacheConfigs: [] as Array<{
    keys: unknown;
    options: { tags?: string[]; revalidate?: number };
  }>,
}));

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(
    fn: T,
    keys: unknown,
    options: { tags?: string[]; revalidate?: number },
  ) => {
    unstableCacheConfigs.push({ keys, options });
    return fn;
  },
  revalidateTag: revalidateTagMock,
}));

vi.mock("../../src/server/db", () => ({
  db: {
    box: { findUnique: boxFindUnique },
    membership: { findMany: membershipFindMany },
  },
}));

import {
  getCachedBoxDiscipline,
  getCachedAthleteMemberships,
  invalidateBoxDiscipline,
  invalidateAthleteMemberships,
  invalidateBoxCache,
  cacheTags,
} from "../../src/server/cache";

describe("cache layer — tags", () => {
  it("cacheTags.boxDiscipline construye tag granular por boxId", () => {
    expect(cacheTags.boxDiscipline("box_abc")).toBe("box:box_abc:discipline");
  });

  it("cacheTags.athleteMemberships construye tag granular por athleteId", () => {
    expect(cacheTags.athleteMemberships("ath_xyz")).toBe(
      "athlete:ath_xyz:memberships",
    );
  });
});

describe("cache layer — tags granulares se registran al config time (regresión)", () => {
  beforeEach(() => {
    unstableCacheConfigs.length = 0;
    boxFindUnique.mockReset();
    membershipFindMany.mockReset();
  });

  it("getCachedBoxDiscipline(boxId) registra tag granular box:${id}:discipline + global", async () => {
    boxFindUnique.mockResolvedValue({ discipline: null });
    await getCachedBoxDiscipline("box_xyz");

    const cfg = unstableCacheConfigs.at(-1);
    expect(cfg).toBeDefined();
    expect(cfg!.options.tags).toEqual([
      "box:box_xyz:discipline",
      "box-discipline",
    ]);
    // El keys array también debe incluir el id para isolation
    expect(cfg!.keys).toEqual(["box-discipline", "box_xyz"]);
  });

  it("getCachedAthleteMemberships(athleteId) registra tag granular athlete:${id}:memberships + global", async () => {
    membershipFindMany.mockResolvedValue([]);
    await getCachedAthleteMemberships("ath_xyz");

    const cfg = unstableCacheConfigs.at(-1);
    expect(cfg).toBeDefined();
    expect(cfg!.options.tags).toEqual([
      "athlete:ath_xyz:memberships",
      "athlete-memberships",
    ]);
    expect(cfg!.keys).toEqual(["athlete-memberships", "ath_xyz"]);
  });

  it("dos boxId distintos producen tags distintos (granularidad real)", async () => {
    boxFindUnique.mockResolvedValue({ discipline: null });
    await getCachedBoxDiscipline("box_a");
    await getCachedBoxDiscipline("box_b");

    const tagsA =
      unstableCacheConfigs[unstableCacheConfigs.length - 2].options.tags;
    const tagsB =
      unstableCacheConfigs[unstableCacheConfigs.length - 1].options.tags;
    expect(tagsA).toContain("box:box_a:discipline");
    expect(tagsB).toContain("box:box_b:discipline");
    expect(tagsA).not.toEqual(tagsB);
  });
});

describe("cache layer — getCachedBoxDiscipline", () => {
  beforeEach(() => {
    boxFindUnique.mockReset();
  });

  it("retorna la discipline cuando el Box existe y tiene relación", async () => {
    boxFindUnique.mockResolvedValue({
      discipline: { id: "crossfit", name: "CrossFit" },
    });

    const result = await getCachedBoxDiscipline("box_abc");

    expect(result).toEqual({ id: "crossfit", name: "CrossFit" });
    expect(boxFindUnique).toHaveBeenCalledWith({
      where: { id: "box_abc" },
      select: { discipline: true },
    });
  });

  it("retorna null cuando el Box no tiene disciplineId backfilled", async () => {
    boxFindUnique.mockResolvedValue({ discipline: null });

    const result = await getCachedBoxDiscipline("box_no_discipline");

    expect(result).toBeNull();
  });

  it("retorna null cuando el Box no existe", async () => {
    boxFindUnique.mockResolvedValue(null);

    const result = await getCachedBoxDiscipline("box_missing");

    expect(result).toBeNull();
  });
});

describe("cache layer — getCachedAthleteMemberships", () => {
  beforeEach(() => {
    membershipFindMany.mockReset();
  });

  it("solo trae memberships ACTIVE del athlete, con plan incluido, ordenadas por startDate desc", async () => {
    const fake = [{ id: "mem_1", planId: "plan_a" }];
    membershipFindMany.mockResolvedValue(fake);

    const result = await getCachedAthleteMemberships("ath_xyz");

    expect(result).toBe(fake);
    expect(membershipFindMany).toHaveBeenCalledWith({
      where: { athleteId: "ath_xyz", status: "ACTIVE" },
      include: { plan: true },
      orderBy: { startDate: "desc" },
    });
  });

  it("retorna lista vacía si el athlete no tiene memberships activas", async () => {
    membershipFindMany.mockResolvedValue([]);

    const result = await getCachedAthleteMemberships("ath_solo");

    expect(result).toEqual([]);
  });
});

describe("cache layer — invalidation", () => {
  beforeEach(() => {
    revalidateTagMock.mockReset();
  });

  it("invalidateBoxDiscipline llama revalidateTag con tag granular + tag global", () => {
    invalidateBoxDiscipline("box_abc");

    expect(revalidateTagMock).toHaveBeenCalledWith("box:box_abc:discipline");
    expect(revalidateTagMock).toHaveBeenCalledWith("box-discipline");
    expect(revalidateTagMock).toHaveBeenCalledTimes(2);
  });

  it("invalidateAthleteMemberships llama revalidateTag con tag granular + tag global", () => {
    invalidateAthleteMemberships("ath_xyz");

    expect(revalidateTagMock).toHaveBeenCalledWith(
      "athlete:ath_xyz:memberships",
    );
    expect(revalidateTagMock).toHaveBeenCalledWith("athlete-memberships");
    expect(revalidateTagMock).toHaveBeenCalledTimes(2);
  });

  it("invalidateBoxCache invalida los tags asociados al Box", () => {
    invalidateBoxCache("box_abc");

    expect(revalidateTagMock).toHaveBeenCalledWith("box:box_abc:discipline");
    expect(revalidateTagMock).toHaveBeenCalledWith("box-discipline");
  });
});
