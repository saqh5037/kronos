/**
 * super-platform.ts — getPlatformStats
 *
 * Probamos:
 *  - Non-super-admin → retorna empty stats (ceros, arrays vacíos)
 *  - Super-admin → totals correctos desde count mocks
 *  - boxesByStatus reducido correctamente desde groupBy mock
 *  - boxes mapeados con ownerEmail + athleteCount + userCount
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  boxCount,
  athleteCount,
  userCount,
  boxGroupBy,
  boxFindMany,
  getServerSessionMock,
  isSuperAdminMock,
} = vi.hoisted(() => ({
  boxCount: vi.fn(),
  athleteCount: vi.fn(),
  userCount: vi.fn(),
  boxGroupBy: vi.fn(),
  boxFindMany: vi.fn(),
  getServerSessionMock: vi.fn(),
  isSuperAdminMock: vi.fn(),
}));

vi.mock("../../src/server/db", () => ({
  db: {
    box: { count: boxCount, groupBy: boxGroupBy, findMany: boxFindMany },
    athlete: { count: athleteCount },
    user: { count: userCount },
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("../../src/server/auth", () => ({
  authOptions: {},
}));

vi.mock("../../src/lib/super-admin", () => ({
  isSuperAdmin: isSuperAdminMock,
}));

import { getPlatformStats } from "../../src/server/actions/super-platform";

const CREATED_AT = new Date("2026-01-15T10:00:00Z");

function mockBoxRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "box_1",
    slug: "iron-hands",
    name: "Iron Hands",
    city: "CDMX",
    country: "MX",
    subscriptionStatus: "TRIAL",
    createdAt: CREATED_AT,
    users: [{ email: "owner@iron.test" }],
    _count: { athletes: 12, users: 5 },
    ...overrides,
  };
}

describe("getPlatformStats", () => {
  beforeEach(() => {
    boxCount.mockReset();
    athleteCount.mockReset();
    userCount.mockReset();
    boxGroupBy.mockReset();
    boxFindMany.mockReset();
    getServerSessionMock.mockResolvedValue({
      user: { email: "super@kronos.test" },
    });
    isSuperAdminMock.mockReturnValue(true);
  });

  it("retorna empty stats si el caller NO es super-admin", async () => {
    isSuperAdminMock.mockReturnValueOnce(false);

    const result = await getPlatformStats();

    expect(result.totalBoxes).toBe(0);
    expect(result.totalAthletes).toBe(0);
    expect(result.totalUsers).toBe(0);
    expect(result.boxesByStatus).toEqual({});
    expect(result.boxes).toEqual([]);

    // NO debe haber queries a la BD cuando el gate falla
    expect(boxCount).not.toHaveBeenCalled();
    expect(athleteCount).not.toHaveBeenCalled();
    expect(userCount).not.toHaveBeenCalled();
    expect(boxGroupBy).not.toHaveBeenCalled();
    expect(boxFindMany).not.toHaveBeenCalled();
  });

  it("retorna totals correctos con super-admin autenticado", async () => {
    boxCount.mockResolvedValue(3);
    athleteCount.mockResolvedValue(47);
    userCount.mockResolvedValue(52);
    boxGroupBy.mockResolvedValue([]);
    boxFindMany.mockResolvedValue([]);

    const result = await getPlatformStats();

    expect(result.totalBoxes).toBe(3);
    expect(result.totalAthletes).toBe(47);
    expect(result.totalUsers).toBe(52);
  });

  it("reduce boxesByStatus correctamente desde groupBy result", async () => {
    boxCount.mockResolvedValue(5);
    athleteCount.mockResolvedValue(0);
    userCount.mockResolvedValue(0);
    boxGroupBy.mockResolvedValue([
      { subscriptionStatus: "TRIAL", _count: { _all: 3 } },
      { subscriptionStatus: "ACTIVE", _count: { _all: 2 } },
    ]);
    boxFindMany.mockResolvedValue([]);

    const result = await getPlatformStats();

    expect(result.boxesByStatus).toEqual({ TRIAL: 3, ACTIVE: 2 });
  });

  it("mapea boxes con ownerEmail, athleteCount y userCount", async () => {
    boxCount.mockResolvedValue(1);
    athleteCount.mockResolvedValue(12);
    userCount.mockResolvedValue(5);
    boxGroupBy.mockResolvedValue([]);
    boxFindMany.mockResolvedValue([mockBoxRow()]);

    const result = await getPlatformStats();

    expect(result.boxes).toHaveLength(1);
    const box = result.boxes[0];
    expect(box.id).toBe("box_1");
    expect(box.slug).toBe("iron-hands");
    expect(box.name).toBe("Iron Hands");
    expect(box.city).toBe("CDMX");
    expect(box.country).toBe("MX");
    expect(box.subscriptionStatus).toBe("TRIAL");
    expect(box.ownerEmail).toBe("owner@iron.test");
    expect(box.athleteCount).toBe(12);
    expect(box.userCount).toBe(5);
    expect(box.createdAt).toEqual(CREATED_AT);
  });

  it("ownerEmail = null cuando no hay usuario OWNER", async () => {
    boxCount.mockResolvedValue(1);
    athleteCount.mockResolvedValue(0);
    userCount.mockResolvedValue(0);
    boxGroupBy.mockResolvedValue([]);
    boxFindMany.mockResolvedValue([mockBoxRow({ users: [] })]);

    const result = await getPlatformStats();

    expect(result.boxes[0].ownerEmail).toBeNull();
  });

  it("boxesByStatus es {} cuando no hay boxes en groupBy", async () => {
    boxCount.mockResolvedValue(0);
    athleteCount.mockResolvedValue(0);
    userCount.mockResolvedValue(0);
    boxGroupBy.mockResolvedValue([]);
    boxFindMany.mockResolvedValue([]);

    const result = await getPlatformStats();

    expect(result.boxesByStatus).toEqual({});
    expect(result.boxes).toEqual([]);
  });

  it("preserva city=null en boxes sin ciudad", async () => {
    boxCount.mockResolvedValue(1);
    athleteCount.mockResolvedValue(0);
    userCount.mockResolvedValue(0);
    boxGroupBy.mockResolvedValue([]);
    boxFindMany.mockResolvedValue([mockBoxRow({ city: null })]);

    const result = await getPlatformStats();

    expect(result.boxes[0].city).toBeNull();
  });
});
