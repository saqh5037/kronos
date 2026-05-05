/**
 * Unit tests for in-app notification helpers.
 * Mocks DB — no real connections.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const notifCreate = vi.hoisted(() => vi.fn());
const notifFindMany = vi.hoisted(() => vi.fn());
const notifCount = vi.hoisted(() => vi.fn());
const notifUpdateMany = vi.hoisted(() => vi.fn());
const userFindUnique = vi.hoisted(() => vi.fn());
const getServerSessionMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/server/db", () => ({
  db: {
    user: { findUnique: userFindUnique },
    inAppNotification: {
      create: notifCreate,
      findMany: notifFindMany,
      count: notifCount,
      updateMany: notifUpdateMany,
    },
  },
  withTenant: vi.fn(),
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
  notify,
  listMyNotifications,
  countUnreadNotifications,
  markRead,
  markAllRead,
} from "../../src/server/actions/notifications";
import { Prisma } from "@prisma/client";

const mockSession = {
  user: { id: "user-1", tenantId: "tenant-1", role: "ATHLETE" },
};

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(mockSession);
  userFindUnique.mockResolvedValue({ tenantId: "tenant-1" });
  notifCreate.mockResolvedValue({ id: "notif-1" });
  notifFindMany.mockResolvedValue([]);
  notifCount.mockResolvedValue(0);
  notifUpdateMany.mockResolvedValue({ count: 0 });
});

// ─── notify() ────────────────────────────────────────────────────────────────

describe("notify()", () => {
  it("crea InAppNotification con campos correctos", async () => {
    await notify("user-1", "SCORE_REGISTERED", {
      title: "Tu score fue registrado",
      body: "5:43 en Fran",
      link: "/atleta/wod",
    });

    expect(notifCreate).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant-1",
        userId: "user-1",
        kind: "SCORE_REGISTERED",
        title: "Tu score fue registrado",
        body: "5:43 en Fran",
        link: "/atleta/wod",
        payload: Prisma.JsonNull,
      },
    });
  });

  it("resuelve tenantId desde user", async () => {
    userFindUnique.mockResolvedValueOnce({ tenantId: "tenant-99" });

    await notify("user-2", "PR_NEW", { title: "Nuevo PR!" });

    expect(notifCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: "tenant-99" }),
      }),
    );
  });

  it("no lanza si user no existe (best-effort)", async () => {
    userFindUnique.mockResolvedValueOnce(null);

    await expect(
      notify("nonexistent", "SCORE_REGISTERED", { title: "test" }),
    ).resolves.toBeUndefined();

    expect(notifCreate).not.toHaveBeenCalled();
  });

  it("no lanza si DB falla (best-effort)", async () => {
    notifCreate.mockRejectedValueOnce(new Error("DB error"));

    await expect(
      notify("user-1", "SCORE_REGISTERED", { title: "test" }),
    ).resolves.toBeUndefined();
  });

  it("guarda extra en payload", async () => {
    await notify("user-1", "ALERT", {
      title: "Alerta",
      extra: { ruleId: "rule-1", amount: 5000 },
    });

    expect(notifCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          payload: { ruleId: "rule-1", amount: 5000 },
        }),
      }),
    );
  });
});

// ─── listMyNotifications() ───────────────────────────────────────────────────

describe("listMyNotifications()", () => {
  it("filtra por userId del session", async () => {
    notifFindMany.mockResolvedValueOnce([
      {
        id: "n1",
        kind: "SCORE_REGISTERED",
        title: "Score",
        body: "5:43",
        link: "/wod",
        readAt: null,
        createdAt: new Date(),
      },
    ]);

    const result = await listMyNotifications();

    expect(notifFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1" }),
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("SCORE_REGISTERED");
  });

  it("aplica filtro unreadOnly cuando se pasa", async () => {
    await listMyNotifications({ unreadOnly: true });

    expect(notifFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ readAt: null }),
      }),
    );
  });

  it("respeta el límite", async () => {
    await listMyNotifications({ limit: 5 });

    expect(notifFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
  });

  it("default limit es 20", async () => {
    await listMyNotifications();

    expect(notifFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    );
  });
});

// ─── countUnreadNotifications() ──────────────────────────────────────────────

describe("countUnreadNotifications()", () => {
  it("cuenta notificaciones sin leer del usuario", async () => {
    notifCount.mockResolvedValueOnce(3);

    const count = await countUnreadNotifications();

    expect(notifCount).toHaveBeenCalledWith({
      where: { userId: "user-1", readAt: null },
    });
    expect(count).toBe(3);
  });
});

// ─── markRead() ──────────────────────────────────────────────────────────────

describe("markRead()", () => {
  it("marca notificaciones como leídas por id", async () => {
    notifUpdateMany.mockResolvedValueOnce({ count: 2 });

    const result = await markRead(["n1", "n2"]);

    expect(notifUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ["n1", "n2"] }, userId: "user-1" },
      data: { readAt: expect.any(Date) },
    });
    expect(result).toEqual({ ok: true });
  });

  it("no llama a DB si ids está vacío", async () => {
    const result = await markRead([]);

    expect(notifUpdateMany).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });
});

// ─── markAllRead() ────────────────────────────────────────────────────────────

describe("markAllRead()", () => {
  it("marca todas las notificaciones del usuario como leídas", async () => {
    const result = await markAllRead();

    expect(notifUpdateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", readAt: null },
      data: { readAt: expect.any(Date) },
    });
    expect(result).toEqual({ ok: true });
  });
});
