/**
 * dispatchAnnouncement / dispatchAllScheduled — lógica del cron.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  announcementFindFirst,
  announcementFindMany,
  announcementUpdate,
  userFindMany,
  athleteFindMany,
  sendEmailMock,
} = vi.hoisted(() => ({
  announcementFindFirst: vi.fn(),
  announcementFindMany: vi.fn(),
  announcementUpdate: vi.fn(),
  userFindMany: vi.fn(),
  athleteFindMany: vi.fn(),
  sendEmailMock: vi.fn(),
}));

vi.mock("../../src/server/db", () => ({
  db: {
    announcement: {
      findFirst: announcementFindFirst,
      findMany: announcementFindMany,
      update: announcementUpdate,
    },
  },
  withTenant: vi.fn(() => ({
    user: { findMany: userFindMany },
    athlete: { findMany: athleteFindMany },
  })),
}));

vi.mock("../../src/lib/email", () => ({
  sendEmail: sendEmailMock,
}));

import {
  dispatchAnnouncement,
  dispatchAllScheduled,
} from "../../src/server/announcements/dispatch";

beforeEach(() => {
  announcementFindFirst.mockReset();
  announcementFindMany.mockReset();
  announcementUpdate.mockReset();
  userFindMany.mockReset();
  athleteFindMany.mockReset();
  sendEmailMock.mockReset();
});

describe("dispatchAnnouncement", () => {
  it("devuelve FAILED si no encuentra el anuncio", async () => {
    announcementFindFirst.mockResolvedValueOnce(null);
    const r = await dispatchAnnouncement("t1", "missing");
    expect(r.status).toBe("FAILED");
    expect(r.error).toMatch(/not found/i);
  });

  it("devuelve SENT si ya estaba SENT (idempotencia)", async () => {
    announcementFindFirst.mockResolvedValueOnce({
      id: "a1",
      tenantId: "t1",
      status: "SENT",
      recipientCount: 5,
    });
    const r = await dispatchAnnouncement("t1", "a1");
    expect(r.status).toBe("SENT");
    expect(r.recipientCount).toBe(5);
    expect(announcementUpdate).not.toHaveBeenCalled();
  });

  it("EMAIL channel: resuelve audiencia ACTIVE, manda email, marca SENT", async () => {
    announcementFindFirst.mockResolvedValueOnce({
      id: "a1",
      tenantId: "t1",
      status: "SCHEDULED",
      audience: "ACTIVE",
      channel: "EMAIL",
      title: "Hola",
      body: "Cuerpo\nlinea2",
    });
    athleteFindMany.mockResolvedValueOnce([
      { id: "ath1", user: { email: "x@y.z" } },
      { id: "ath2", user: { email: "a@b.c" } },
      { id: "ath3", user: null }, // sin email
    ]);
    sendEmailMock.mockResolvedValueOnce({ ok: true });

    const r = await dispatchAnnouncement("t1", "a1");

    expect(announcementUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: "a1" },
      data: { status: "SENDING" },
    });
    expect(sendEmailMock).toHaveBeenCalledWith({
      to: ["x@y.z", "a@b.c"],
      subject: "Hola",
      html: "<p>Cuerpo<br/>linea2</p>",
    });
    expect(announcementUpdate).toHaveBeenLastCalledWith({
      where: { id: "a1" },
      data: expect.objectContaining({
        status: "SENT",
        recipientCount: 3,
      }),
    });
    expect(r.status).toBe("SENT");
  });

  it("COACHES audience: solo COACH/OWNER por email", async () => {
    announcementFindFirst.mockResolvedValueOnce({
      id: "a2",
      tenantId: "t1",
      status: "SCHEDULED",
      audience: "COACHES",
      channel: "EMAIL",
      title: "Coach memo",
      body: "x",
    });
    userFindMany.mockResolvedValueOnce([
      { email: "coach@x.com" },
      { email: "owner@x.com" },
    ]);
    sendEmailMock.mockResolvedValueOnce({ ok: true });

    const r = await dispatchAnnouncement("t1", "a2");

    expect(userFindMany).toHaveBeenCalledWith({
      where: { role: { in: ["COACH", "OWNER"] } },
      select: { email: true },
    });
    expect(r.recipientCount).toBe(2);
  });

  it("IN_APP channel: NO llama sendEmail pero sí marca SENT", async () => {
    announcementFindFirst.mockResolvedValueOnce({
      id: "a3",
      tenantId: "t1",
      status: "SCHEDULED",
      audience: "ALL",
      channel: "IN_APP",
      title: "Inbox",
      body: "x",
    });
    athleteFindMany.mockResolvedValueOnce([
      { id: "a", user: { email: "a@b.c" } },
    ]);

    const r = await dispatchAnnouncement("t1", "a3");
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(r.status).toBe("SENT");
  });

  it("captura excepciones y persiste FAILED", async () => {
    announcementFindFirst.mockResolvedValueOnce({
      id: "a4",
      tenantId: "t1",
      status: "SCHEDULED",
      audience: "ALL",
      channel: "EMAIL",
      title: "x",
      body: "x",
    });
    athleteFindMany.mockRejectedValueOnce(new Error("DB down"));

    const r = await dispatchAnnouncement("t1", "a4");
    expect(r.status).toBe("FAILED");
    expect(r.error).toBe("DB down");
    expect(announcementUpdate).toHaveBeenLastCalledWith({
      where: { id: "a4" },
      data: { status: "FAILED" },
    });
  });
});

describe("dispatchAllScheduled", () => {
  it("itera SCHEDULED con scheduledAt <= now y devuelve resumen", async () => {
    announcementFindMany.mockResolvedValueOnce([
      { id: "a1", tenantId: "t1" },
      { id: "a2", tenantId: "t1" },
    ]);
    // Para cada findFirst dentro de dispatchAnnouncement
    announcementFindFirst
      .mockResolvedValueOnce({
        id: "a1",
        tenantId: "t1",
        status: "SCHEDULED",
        audience: "ALL",
        channel: "IN_APP",
        title: "x",
        body: "x",
      })
      .mockResolvedValueOnce({
        id: "a2",
        tenantId: "t1",
        status: "SCHEDULED",
        audience: "ALL",
        channel: "IN_APP",
        title: "y",
        body: "y",
      });
    athleteFindMany.mockResolvedValue([]);

    const summary = await dispatchAllScheduled(new Date());
    expect(summary.total).toBe(2);
    expect(summary.sent).toBe(2);
    expect(summary.failed).toBe(0);
    expect(announcementFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "SCHEDULED",
          scheduledAt: expect.objectContaining({ lte: expect.any(Date) }),
        }),
        take: 100,
      }),
    );
  });

  it("acumula failed cuando algún dispatch falla", async () => {
    announcementFindMany.mockResolvedValueOnce([
      { id: "a1", tenantId: "t1" },
      { id: "a2", tenantId: "t1" },
    ]);
    announcementFindFirst
      .mockResolvedValueOnce({
        id: "a1",
        tenantId: "t1",
        status: "SCHEDULED",
        audience: "ALL",
        channel: "IN_APP",
        title: "x",
        body: "x",
      })
      .mockResolvedValueOnce(null); // a2 no encontrado → FAILED

    athleteFindMany.mockResolvedValue([]);

    const summary = await dispatchAllScheduled();
    expect(summary.sent).toBe(1);
    expect(summary.failed).toBe(1);
  });
});
