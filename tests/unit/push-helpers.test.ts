/**
 * Unit tests for web push helpers (S3.2).
 * Tests: sendPushToUser sends notifications, removes stale subscriptions (410).
 * Mocks web-push + DB — no real push infrastructure needed.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const pushFindMany = vi.hoisted(() => vi.fn());
const pushDeleteMany = vi.hoisted(() => vi.fn());
const sendNotificationMock = vi.hoisted(() => vi.fn());
const setVapidDetailsMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/server/db", () => ({
  db: {
    pushSubscription: {
      findMany: pushFindMany,
      deleteMany: pushDeleteMany,
    },
  },
}));

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: setVapidDetailsMock,
    sendNotification: sendNotificationMock,
  },
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Set VAPID env vars so the helper doesn't early-return
  process.env.VAPID_PUBLIC_KEY =
    "BTest_public_key_placeholder_for_testing_only";
  process.env.VAPID_PRIVATE_KEY = "test_private_key_placeholder_for_testing";
  process.env.VAPID_SUBJECT = "mailto:test@kronos.app";
});

describe("sendPushToUser", () => {
  it("does nothing when user has no subscriptions", async () => {
    pushFindMany.mockResolvedValue([]);

    const { sendPushToUser } = await import("../../src/server/push");
    await sendPushToUser("user-1", { title: "Test", body: "Hello" });

    expect(sendNotificationMock).not.toHaveBeenCalled();
    expect(pushDeleteMany).not.toHaveBeenCalled();
  });

  it("sends notification to each subscription", async () => {
    pushFindMany.mockResolvedValue([
      {
        id: "sub-1",
        endpoint: "https://push.example.com/1",
        p256dh: "key1",
        auth: "auth1",
      },
      {
        id: "sub-2",
        endpoint: "https://push.example.com/2",
        p256dh: "key2",
        auth: "auth2",
      },
    ]);
    sendNotificationMock.mockResolvedValue({ statusCode: 201 });

    const { sendPushToUser } = await import("../../src/server/push");
    await sendPushToUser("user-1", {
      title: "Test",
      body: "Hello",
      link: "/atleta",
    });

    expect(sendNotificationMock).toHaveBeenCalledTimes(2);
    expect(pushDeleteMany).not.toHaveBeenCalled();
  });

  it("deletes stale subscription when server returns 410", async () => {
    pushFindMany.mockResolvedValue([
      {
        id: "sub-gone",
        endpoint: "https://push.example.com/gone",
        p256dh: "k",
        auth: "a",
      },
    ]);
    const err410 = Object.assign(new Error("Gone"), { statusCode: 410 });
    sendNotificationMock.mockRejectedValue(err410);

    const { sendPushToUser } = await import("../../src/server/push");
    await sendPushToUser("user-1", { title: "Alert", body: "X" });

    expect(pushDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["sub-gone"] } },
    });
  });

  it("deletes stale subscription when server returns 404", async () => {
    pushFindMany.mockResolvedValue([
      {
        id: "sub-404",
        endpoint: "https://push.example.com/404",
        p256dh: "k",
        auth: "a",
      },
    ]);
    const err404 = Object.assign(new Error("Not Found"), { statusCode: 404 });
    sendNotificationMock.mockRejectedValue(err404);

    const { sendPushToUser } = await import("../../src/server/push");
    await sendPushToUser("user-1", { title: "Alert", body: "X" });

    expect(pushDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["sub-404"] } },
    });
  });

  it("never throws even if all sends fail with unknown error", async () => {
    pushFindMany.mockResolvedValue([
      {
        id: "sub-err",
        endpoint: "https://push.example.com/err",
        p256dh: "k",
        auth: "a",
      },
    ]);
    sendNotificationMock.mockRejectedValue(new Error("Network error"));

    const { sendPushToUser } = await import("../../src/server/push");
    // Should not throw
    await expect(
      sendPushToUser("user-1", { title: "Test", body: "X" }),
    ).resolves.toBeUndefined();
  });

  it("sends notification payload as JSON with link", async () => {
    pushFindMany.mockResolvedValue([
      {
        id: "sub-1",
        endpoint: "https://push.example.com/1",
        p256dh: "k",
        auth: "a",
      },
    ]);
    sendNotificationMock.mockResolvedValue({});

    const { sendPushToUser } = await import("../../src/server/push");
    await sendPushToUser("user-1", {
      title: "PR!",
      body: "Nuevo récord",
      link: "/atleta/perfil",
    });

    expect(sendNotificationMock).toHaveBeenCalledOnce();
    const [, data] = sendNotificationMock.mock.calls[0];
    const parsed = JSON.parse(data as string);
    expect(parsed.title).toBe("PR!");
    expect(parsed.body).toBe("Nuevo récord");
    expect(parsed.link).toBe("/atleta/perfil");
  });
});
