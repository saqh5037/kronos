/**
 * super-pilotos.ts — listPilotBoxes + generatePilotBetaTokenForBox.
 *
 * Probamos:
 *  - listPilotBoxes filtra solo Boxes con pilotExclusivityExpiresAt set
 *  - daysLeft calculados correctamente (null si vencido)
 *  - Métricas agregadas (athletes/wods/push) se mapean del query result
 *  - generatePilotBetaTokenForBox valida Box existe + es piloto antes de firmar
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  boxFindMany,
  boxFindUnique,
  pushGroupBy,
  signPilotBetaTokenMock,
  getServerSessionMock,
  isSuperAdminMock,
} = vi.hoisted(() => ({
  boxFindMany: vi.fn(),
  boxFindUnique: vi.fn(),
  pushGroupBy: vi.fn(),
  signPilotBetaTokenMock: vi.fn(),
  getServerSessionMock: vi.fn(),
  isSuperAdminMock: vi.fn(),
}));

vi.mock("../../src/server/db", () => ({
  db: {
    box: { findMany: boxFindMany, findUnique: boxFindUnique },
    pushSubscription: { groupBy: pushGroupBy },
  },
}));

vi.mock("../../src/lib/pilot-beta-token", () => ({
  signPilotBetaToken: signPilotBetaTokenMock,
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

import {
  listPilotBoxes,
  generatePilotBetaTokenForBox,
} from "../../src/server/actions/super-pilotos";

const NOW = new Date("2026-05-16T12:00:00Z");

function daysFromNow(days: number): Date {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);
}

function mockBox(overrides: Record<string, unknown> = {}) {
  return {
    id: "box_a",
    slug: "iron-hands",
    name: "Iron Hands",
    city: "CDMX",
    country: "MX",
    subscriptionStatus: "TRIAL",
    trialEndsAt: daysFromNow(20),
    pilotExclusivityExpiresAt: daysFromNow(50),
    pilotBetaSignedAt: null,
    createdAt: daysFromNow(-10),
    discipline: { slug: "crossfit", name: "CrossFit" },
    users: [{ email: "owner@iron.test", name: "Iron Owner" }],
    _count: { athletes: 12, wods: 5 },
    ...overrides,
  };
}

describe("listPilotBoxes", () => {
  beforeEach(() => {
    boxFindMany.mockReset();
    pushGroupBy.mockReset();
    // Default: caller es super-admin. Tests específicos sobrescriben.
    getServerSessionMock.mockResolvedValue({
      user: { email: "super@kronos.test" },
    });
    isSuperAdminMock.mockReturnValue(true);
  });

  it("retorna [] (defensa silenciosa) si el caller NO es super-admin", async () => {
    isSuperAdminMock.mockReturnValueOnce(false);

    const result = await listPilotBoxes(NOW);

    expect(result).toEqual([]);
    // NO debe haber query DB cuando el gate falla
    expect(boxFindMany).not.toHaveBeenCalled();
    expect(pushGroupBy).not.toHaveBeenCalled();
  });

  it("filtra solo Boxes con pilotExclusivityExpiresAt set", async () => {
    boxFindMany.mockResolvedValue([]);
    pushGroupBy.mockResolvedValue([]);

    await listPilotBoxes(NOW);

    const arg = boxFindMany.mock.calls[0][0];
    expect(arg.where.pilotExclusivityExpiresAt).toEqual({ not: null });
    expect(arg.orderBy).toEqual({ createdAt: "desc" });
  });

  it("retorna [] cuando no hay pilots (sin push groupBy query)", async () => {
    boxFindMany.mockResolvedValue([]);

    const result = await listPilotBoxes(NOW);

    expect(result).toEqual([]);
    expect(pushGroupBy).not.toHaveBeenCalled();
  });

  it("calcula trialDaysLeft y exclusivityDaysLeft correctamente", async () => {
    boxFindMany.mockResolvedValue([mockBox()]);
    pushGroupBy.mockResolvedValue([]);

    const result = await listPilotBoxes(NOW);

    expect(result).toHaveLength(1);
    expect(result[0].trialDaysLeft).toBe(20);
    expect(result[0].exclusivityDaysLeft).toBe(50);
  });

  it("retorna trialDaysLeft=null si trial ya venció", async () => {
    boxFindMany.mockResolvedValue([mockBox({ trialEndsAt: daysFromNow(-5) })]);
    pushGroupBy.mockResolvedValue([]);

    const result = await listPilotBoxes(NOW);
    expect(result[0].trialDaysLeft).toBeNull();
  });

  it("mapea métricas _count + push count desde groupBy", async () => {
    boxFindMany.mockResolvedValue([mockBox()]);
    pushGroupBy.mockResolvedValue([{ tenantId: "box_a", _count: { _all: 7 } }]);

    const result = await listPilotBoxes(NOW);

    expect(result[0].athleteCount).toBe(12);
    expect(result[0].wodCount).toBe(5);
    expect(result[0].pushSubscriptionCount).toBe(7);
  });

  it("pushSubscriptionCount = 0 cuando el Box no tiene push subs", async () => {
    boxFindMany.mockResolvedValue([mockBox()]);
    pushGroupBy.mockResolvedValue([]); // no rows for this tenantId

    const result = await listPilotBoxes(NOW);
    expect(result[0].pushSubscriptionCount).toBe(0);
  });

  it("mapea owner correctamente cuando hay user OWNER", async () => {
    boxFindMany.mockResolvedValue([mockBox()]);
    pushGroupBy.mockResolvedValue([]);

    const result = await listPilotBoxes(NOW);
    expect(result[0].ownerEmail).toBe("owner@iron.test");
    expect(result[0].ownerName).toBe("Iron Owner");
  });

  it("ownerEmail = null cuando no hay user OWNER (Box huérfano)", async () => {
    boxFindMany.mockResolvedValue([mockBox({ users: [] })]);
    pushGroupBy.mockResolvedValue([]);

    const result = await listPilotBoxes(NOW);
    expect(result[0].ownerEmail).toBeNull();
  });

  it("propaga pilotBetaSignedAt cuando ya firmó", async () => {
    const signedAt = daysFromNow(-3);
    boxFindMany.mockResolvedValue([mockBox({ pilotBetaSignedAt: signedAt })]);
    pushGroupBy.mockResolvedValue([]);

    const result = await listPilotBoxes(NOW);
    expect(result[0].pilotBetaSignedAt).toEqual(signedAt);
  });
});

describe("generatePilotBetaTokenForBox", () => {
  beforeEach(() => {
    boxFindUnique.mockReset();
    signPilotBetaTokenMock.mockReset();
    getServerSessionMock.mockResolvedValue({
      user: { email: "super@kronos.test" },
    });
    isSuperAdminMock.mockReturnValue(true);
  });

  it("UNAUTHORIZED si el caller NO es super-admin (defensa en profundidad)", async () => {
    isSuperAdminMock.mockReturnValueOnce(false);

    const result = await generatePilotBetaTokenForBox({ boxId: "box_a" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("UNAUTHORIZED");
    // NO debe haber query DB ni firma de token
    expect(boxFindUnique).not.toHaveBeenCalled();
    expect(signPilotBetaTokenMock).not.toHaveBeenCalled();
  });

  it("BOX_NOT_FOUND si el Box no existe", async () => {
    boxFindUnique.mockResolvedValue(null);

    const result = await generatePilotBetaTokenForBox({ boxId: "missing" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("BOX_NOT_FOUND");
  });

  it("NOT_PILOT si el Box no tiene pilotExclusivityExpiresAt", async () => {
    boxFindUnique.mockResolvedValue({
      id: "box_a",
      pilotExclusivityExpiresAt: null,
    });

    const result = await generatePilotBetaTokenForBox({ boxId: "box_a" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("NOT_PILOT");
  });

  it("MISSING_SECRET si signPilotBetaToken throws", async () => {
    boxFindUnique.mockResolvedValue({
      id: "box_a",
      pilotExclusivityExpiresAt: daysFromNow(60),
    });
    signPilotBetaTokenMock.mockImplementation(() => {
      throw new Error("PILOT_BETA_TOKEN_SECRET no configurado");
    });

    const result = await generatePilotBetaTokenForBox({ boxId: "box_a" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("MISSING_SECRET");
  });

  it("retorna URL completa con token + expiresAt cuando OK", async () => {
    boxFindUnique.mockResolvedValue({
      id: "box_a",
      pilotExclusivityExpiresAt: daysFromNow(60),
    });
    signPilotBetaTokenMock.mockReturnValue("fake-token-abc.deadbeef");

    const result = await generatePilotBetaTokenForBox({ boxId: "box_a" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.url).toContain("/piloto-beta?token=fake-token-abc.deadbeef");
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
