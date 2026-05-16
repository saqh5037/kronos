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

const { boxFindUnique, membershipFindMany, revalidateTagMock } = vi.hoisted(
  () => ({
    boxFindUnique: vi.fn(),
    membershipFindMany: vi.fn(),
    revalidateTagMock: vi.fn(),
  }),
);

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
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
