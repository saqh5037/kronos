/**
 * Unit tests for athlete alias helpers.
 * Mocks DB — no real connections.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const aliasUpsert = vi.hoisted(() => vi.fn());
const aliasDelete = vi.hoisted(() => vi.fn());
const aliasFindMany = vi.hoisted(() => vi.fn());
const aliasFindFirst = vi.hoisted(() => vi.fn());
const athleteFindUnique = vi.hoisted(() => vi.fn());
const getServerSessionMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/server/db", () => ({
  db: {
    athleteAlias: {
      upsert: aliasUpsert,
      delete: aliasDelete,
      findMany: aliasFindMany,
      findFirst: aliasFindFirst,
    },
    athlete: { findUnique: athleteFindUnique },
  },
  withTenant: vi.fn(() => ({
    athleteAlias: {
      findMany: aliasFindMany,
    },
    athlete: {
      findUnique: athleteFindUnique,
    },
  })),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("../../src/server/auth", () => ({
  authOptions: {},
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  addAlias,
  removeAlias,
  getAliasDict,
} from "../../src/server/actions/aliases";

const mockCoachSession = {
  user: { id: "user-1", tenantId: "tenant-1", role: "COACH" },
};

const mockOwnerSession = {
  user: { id: "user-1", tenantId: "tenant-1", role: "OWNER" },
};

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(mockCoachSession);
  athleteFindUnique.mockResolvedValue({
    id: "athlete-1",
    tenantId: "tenant-1",
  });
  aliasUpsert.mockResolvedValue({ id: "alias-1" });
  aliasDelete.mockResolvedValue({ id: "alias-1" });
});

// ─── addAlias() ───────────────────────────────────────────────────────────────

describe("addAlias()", () => {
  it("hace upsert con los campos correctos", async () => {
    const result = await addAlias("athlete-1", "Memo");

    expect(aliasUpsert).toHaveBeenCalledWith({
      where: { tenantId_alias: { tenantId: "tenant-1", alias: "Memo" } },
      update: { athleteId: "athlete-1", createdById: "user-1" },
      create: {
        tenantId: "tenant-1",
        athleteId: "athlete-1",
        alias: "Memo",
        createdById: "user-1",
      },
    });
    expect(result).toEqual({ ok: true });
  });

  it("normaliza el alias (trim)", async () => {
    await addAlias("athlete-1", "  Memo  ");

    expect(aliasUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId_alias: { tenantId: "tenant-1", alias: "Memo" } },
      }),
    );
  });

  it("lanza error si alias vacío", async () => {
    await expect(addAlias("athlete-1", "   ")).rejects.toThrow(
      "El apodo no puede estar vacío",
    );

    expect(aliasUpsert).not.toHaveBeenCalled();
  });

  it("lanza error si atleta no existe", async () => {
    athleteFindUnique.mockResolvedValueOnce(null);

    await expect(addAlias("nonexistent", "Memo")).rejects.toThrow(
      "Atleta no encontrado",
    );
  });

  it("permite COACH hacer upsert", async () => {
    getServerSessionMock.mockResolvedValueOnce(mockCoachSession);

    const result = await addAlias("athlete-1", "Flaco");

    expect(result).toEqual({ ok: true });
  });

  it("permite OWNER hacer upsert", async () => {
    getServerSessionMock.mockResolvedValueOnce(mockOwnerSession);
    athleteFindUnique.mockResolvedValueOnce({ id: "athlete-1" });

    const result = await addAlias("athlete-1", "ElCapo");

    expect(result).toEqual({ ok: true });
  });

  it("falla para ATHLETE (sin permiso)", async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { id: "user-2", tenantId: "tenant-1", role: "ATHLETE" },
    });

    await expect(addAlias("athlete-1", "Memo")).rejects.toThrow("Forbidden");
  });

  it("hace upsert (no duplica si alias ya existe)", async () => {
    // Llama dos veces con el mismo alias — upsert debe manejar la colisión
    await addAlias("athlete-1", "Memo");
    await addAlias("athlete-2", "Memo"); // reasigna el alias a otro atleta

    expect(aliasUpsert).toHaveBeenCalledTimes(2);
    // La segunda llamada debe usar update para reasignar
    expect(aliasUpsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        update: { athleteId: "athlete-2", createdById: "user-1" },
      }),
    );
  });
});

// ─── removeAlias() ────────────────────────────────────────────────────────────

describe("removeAlias()", () => {
  it("elimina alias existente (OWNER)", async () => {
    getServerSessionMock.mockResolvedValueOnce(mockOwnerSession);
    aliasFindFirst.mockResolvedValueOnce({
      id: "alias-1",
      tenantId: "tenant-1",
    });

    const result = await removeAlias("alias-1");

    expect(aliasDelete).toHaveBeenCalledWith({ where: { id: "alias-1" } });
    expect(result).toEqual({ ok: true });
  });

  it("lanza error si alias no pertenece al tenant", async () => {
    getServerSessionMock.mockResolvedValueOnce(mockOwnerSession);
    aliasFindFirst.mockResolvedValueOnce(null);

    await expect(removeAlias("alias-x")).rejects.toThrow("Apodo no encontrado");
  });

  it("falla para COACH (solo OWNER puede borrar)", async () => {
    getServerSessionMock.mockResolvedValueOnce(mockCoachSession);

    await expect(removeAlias("alias-1")).rejects.toThrow("Forbidden");
  });
});

// ─── getAliasDict() ───────────────────────────────────────────────────────────

describe("getAliasDict()", () => {
  it("retorna diccionario alias→athleteId lowercase", async () => {
    aliasFindMany.mockResolvedValueOnce([
      { alias: "Memo", athleteId: "athlete-3" },
      { alias: "Pato", athleteId: "athlete-2" },
    ]);

    const dict = await getAliasDict("tenant-1");

    expect(dict).toEqual({
      memo: "athlete-3",
      pato: "athlete-2",
    });
  });

  it("retorna diccionario vacío si no hay aliases", async () => {
    aliasFindMany.mockResolvedValueOnce([]);

    const dict = await getAliasDict("tenant-1");

    expect(dict).toEqual({});
  });

  it("llama a rawDb con tenantId correcto", async () => {
    aliasFindMany.mockResolvedValueOnce([]);

    await getAliasDict("tenant-99");

    expect(aliasFindMany).toHaveBeenCalledWith({
      where: { tenantId: "tenant-99" },
      select: { alias: true, athleteId: true },
    });
  });
});
