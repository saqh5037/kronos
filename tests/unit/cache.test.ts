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
  prFindMany,
  movementFindMany,
  badgeFindMany,
  classFindFirst,
  revalidateTagMock,
  unstableCacheConfigs,
} = vi.hoisted(() => ({
  boxFindUnique: vi.fn(),
  membershipFindMany: vi.fn(),
  prFindMany: vi.fn(),
  movementFindMany: vi.fn(),
  badgeFindMany: vi.fn(),
  classFindFirst: vi.fn(),
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
    pR: { findMany: prFindMany },
    movement: { findMany: movementFindMany },
    badge: { findMany: badgeFindMany },
    class: { findFirst: classFindFirst },
  },
}));

import {
  getCachedBoxDiscipline,
  getCachedAthleteMemberships,
  invalidateBoxDiscipline,
  invalidateAthleteMemberships,
  invalidateBoxCache,
  getCachedBoxMovementStats,
  invalidatePRStats,
  getCachedMovementCatalog,
  invalidateMovementCatalog,
  getCachedBadgeCatalog,
  invalidateBadgeCatalog,
  getCachedTodayWod,
  invalidateTodayWod,
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

// ─── getCachedBoxMovementStats ───────────────────────────────────────────────

describe("cache layer — getCachedBoxMovementStats", () => {
  beforeEach(() => {
    unstableCacheConfigs.length = 0;
    prFindMany.mockReset();
  });

  it("registra tag granular prstats:{tenantId} + global box-movement-stats", async () => {
    prFindMany.mockResolvedValue([]);
    await getCachedBoxMovementStats("tenant_a");

    const cfg = unstableCacheConfigs.at(-1);
    expect(cfg).toBeDefined();
    expect(cfg!.options.tags).toEqual([
      "prstats:tenant_a",
      "box-movement-stats",
    ]);
    expect(cfg!.keys).toEqual(["box-movement-stats", "tenant_a"]);
    expect(cfg!.options.revalidate).toBe(15 * 60);
  });

  it("retorna shape vacío cuando no hay PRs en el box", async () => {
    prFindMany.mockResolvedValue([]);
    const result = await getCachedBoxMovementStats("tenant_empty");

    expect(result.byMovement).toEqual({});
    expect(result.overallScores).toEqual([]);
    expect(result.overallByAthlete).toEqual({});
  });

  it("byMovement.max usa el valor numérico mayor (semántica histórica)", async () => {
    prFindMany.mockResolvedValue([
      {
        athleteId: "a1",
        movementId: "m1",
        value: "100",
        movement: { name: "Squat" },
      },
      {
        athleteId: "a2",
        movementId: "m1",
        value: "120",
        movement: { name: "Squat" },
      },
      {
        athleteId: "a1",
        movementId: "m1",
        value: "80",
        movement: { name: "Squat" },
      },
    ]);

    const result = await getCachedBoxMovementStats("tenant_x");
    expect(result.byMovement["m1"].max).toBe(120);
    expect(result.byMovement["m1"].values).toHaveLength(3);
    expect(result.byMovement["m1"].movementName).toBe("Squat");
  });

  it("overallScores tiene un entry por atleta, no por PR", async () => {
    // 2 atletas, 2 PRs cada uno (mismos movimientos)
    prFindMany.mockResolvedValue([
      {
        athleteId: "a1",
        movementId: "m1",
        value: "100",
        movement: { name: "Squat" },
      },
      {
        athleteId: "a1",
        movementId: "m2",
        value: "60",
        movement: { name: "Deadlift" },
      },
      {
        athleteId: "a2",
        movementId: "m1",
        value: "90",
        movement: { name: "Squat" },
      },
      {
        athleteId: "a2",
        movementId: "m2",
        value: "80",
        movement: { name: "Deadlift" },
      },
    ]);

    const result = await getCachedBoxMovementStats("tenant_x");
    expect(result.overallScores).toHaveLength(2);
    expect(Object.keys(result.overallByAthlete)).toEqual(
      expect.arrayContaining(["a1", "a2"]),
    );
  });

  it("invalidatePRStats llama revalidateTag con tag granular del tenant", () => {
    revalidateTagMock.mockReset();
    invalidatePRStats("tenant_abc");
    expect(revalidateTagMock).toHaveBeenCalledWith("prstats:tenant_abc");
    expect(revalidateTagMock).toHaveBeenCalledTimes(1);
  });
});

// ─── getCachedMovementCatalog ────────────────────────────────────────────────

describe("cache layer — getCachedMovementCatalog", () => {
  beforeEach(() => {
    unstableCacheConfigs.length = 0;
    movementFindMany.mockReset();
    revalidateTagMock.mockReset();
  });

  it("registra tag granular movements:{tenantId}:catalog + TTL 1h", async () => {
    movementFindMany.mockResolvedValue([]);
    await getCachedMovementCatalog("tenant_a");

    const cfg = unstableCacheConfigs.at(-1);
    expect(cfg!.options.tags).toEqual([
      "movements:tenant_a:catalog",
      "movement-catalog",
    ]);
    expect(cfg!.options.revalidate).toBe(60 * 60);
  });

  it("incluye tenantId como parámetro de aislamiento en keys", async () => {
    movementFindMany.mockResolvedValue([]);
    await getCachedMovementCatalog("tenant_b");

    const cfg = unstableCacheConfigs.at(-1);
    expect(cfg!.keys).toContain("tenant_b");
  });

  it("invalidateMovementCatalog dispara tag granular del tenant", () => {
    invalidateMovementCatalog("tenant_x");
    expect(revalidateTagMock).toHaveBeenCalledWith(
      "movements:tenant_x:catalog",
    );
    expect(revalidateTagMock).toHaveBeenCalledTimes(1);
  });
});

// ─── getCachedBadgeCatalog ───────────────────────────────────────────────────

describe("cache layer — getCachedBadgeCatalog", () => {
  beforeEach(() => {
    unstableCacheConfigs.length = 0;
    badgeFindMany.mockReset();
    revalidateTagMock.mockReset();
  });

  it("registra tag granular badges:{tenantId}:catalog + TTL 6h", async () => {
    badgeFindMany.mockResolvedValue([]);
    await getCachedBadgeCatalog("tenant_a");

    const cfg = unstableCacheConfigs.at(-1);
    expect(cfg!.options.tags).toEqual([
      "badges:tenant_a:catalog",
      "badge-catalog",
    ]);
    expect(cfg!.options.revalidate).toBe(6 * 60 * 60);
  });

  it("retorna badges del tenant en orden code asc", async () => {
    const fakeBadges = [
      { id: "b1", code: "ALPHA" },
      { id: "b2", code: "BETA" },
    ];
    badgeFindMany.mockResolvedValue(fakeBadges);

    const result = await getCachedBadgeCatalog("tenant_b");
    expect(result).toBe(fakeBadges);
    expect(badgeFindMany).toHaveBeenCalledWith({
      where: { tenantId: "tenant_b" },
      orderBy: { code: "asc" },
    });
  });

  it("invalidateBadgeCatalog dispara tag granular del tenant", () => {
    invalidateBadgeCatalog("tenant_y");
    expect(revalidateTagMock).toHaveBeenCalledWith("badges:tenant_y:catalog");
    expect(revalidateTagMock).toHaveBeenCalledTimes(1);
  });
});

// ─── getCachedTodayWod ───────────────────────────────────────────────────────

describe("cache layer — getCachedTodayWod", () => {
  beforeEach(() => {
    unstableCacheConfigs.length = 0;
    classFindFirst.mockReset();
    revalidateTagMock.mockReset();
  });

  it("registra tag granular wod:{tenantId}:{dateKey} + TTL 10 min", async () => {
    classFindFirst.mockResolvedValue(null);
    await getCachedTodayWod("tenant_a", "2026-06-09");

    const cfg = unstableCacheConfigs.at(-1);
    expect(cfg!.options.tags).toEqual(["wod:tenant_a:2026-06-09", "today-wod"]);
    expect(cfg!.options.revalidate).toBe(10 * 60);
  });

  it("retorna null cuando no hay clase activa con WOD en esa fecha", async () => {
    classFindFirst.mockResolvedValue(null);
    const result = await getCachedTodayWod("tenant_a", "2026-06-09");
    expect(result).toBeNull();
  });

  it("retorna shape WOD sin info por-atleta cuando hay clase activa", async () => {
    const fakeClass = {
      id: "cls_1",
      startsAt: new Date("2026-06-09T09:00:00Z"),
      wod: {
        id: "wod_1",
        name: "Fran",
        type: "AMRAP",
        scoreType: "REPS",
        description: null,
        timeCap: 20,
        movements: [
          {
            movementId: "mv_1",
            reps: 21,
            weight: null,
            notes: null,
            order: 0,
            movement: { name: "Thruster" },
          },
        ],
      },
    };
    classFindFirst.mockResolvedValue(fakeClass);

    const result = await getCachedTodayWod("tenant_a", "2026-06-09");
    expect(result).not.toBeNull();
    expect(result!.wodId).toBe("wod_1");
    expect(result!.wodName).toBe("Fran");
    expect(result!.movements).toHaveLength(1);
    // Debe NO incluir datos por-atleta (scores, athleteId, etc.)
    expect(result).not.toHaveProperty("scores");
    expect(result).not.toHaveProperty("athleteId");
  });

  it("two tenants on same date get distinct tags (cross-tenant isolation)", async () => {
    classFindFirst.mockResolvedValue(null);
    await getCachedTodayWod("tenant_a", "2026-06-09");
    await getCachedTodayWod("tenant_b", "2026-06-09");

    const tagsA =
      unstableCacheConfigs[unstableCacheConfigs.length - 2].options.tags;
    const tagsB =
      unstableCacheConfigs[unstableCacheConfigs.length - 1].options.tags;
    expect(tagsA).toContain("wod:tenant_a:2026-06-09");
    expect(tagsB).toContain("wod:tenant_b:2026-06-09");
    expect(tagsA).not.toEqual(tagsB);
  });

  it("invalidateTodayWod dispara solo el tag del tenant+fecha específico", () => {
    invalidateTodayWod("tenant_x", "2026-06-09");
    expect(revalidateTagMock).toHaveBeenCalledWith("wod:tenant_x:2026-06-09");
    expect(revalidateTagMock).toHaveBeenCalledTimes(1);
  });
});

// ─── cacheTags — nuevos tags builders ────────────────────────────────────────

describe("cache layer — cacheTags nuevos builders", () => {
  it("cacheTags.prStats construye tag con tenantId", () => {
    expect(cacheTags.prStats("t1")).toBe("prstats:t1");
  });

  it("cacheTags.movementCatalog construye tag con tenantId", () => {
    expect(cacheTags.movementCatalog("t1")).toBe("movements:t1:catalog");
  });

  it("cacheTags.badgeCatalog construye tag con tenantId", () => {
    expect(cacheTags.badgeCatalog("t1")).toBe("badges:t1:catalog");
  });

  it("cacheTags.todayWod construye tag con tenantId + dateKey", () => {
    expect(cacheTags.todayWod("t1", "2026-06-09")).toBe("wod:t1:2026-06-09");
  });
});
