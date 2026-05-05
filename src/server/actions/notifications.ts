"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { db as rawDb } from "../db";
import { Prisma, type NotificationKind } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationPayload = {
  title: string;
  body?: string;
  link?: string;
  extra?: Record<string, unknown>;
};

export type NotificationRow = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

// ─── Core helpers (non-server-action, called internally) ──────────────────────

/**
 * Creates an InAppNotification for a user. Best-effort — never throws.
 * Safe to call from server actions and from evaluateAndDispatch.
 */
export async function notify(
  userId: string,
  kind: NotificationKind,
  payload: NotificationPayload,
): Promise<void> {
  try {
    // Resolve tenantId from user
    const user = await rawDb.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });
    if (!user) return;

    await rawDb.inAppNotification.create({
      data: {
        tenantId: user.tenantId,
        userId,
        kind,
        title: payload.title,
        body: payload.body ?? null,
        link: payload.link ?? null,
        payload: payload.extra
          ? (payload.extra as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  } catch (err) {
    // Best-effort: notification failure must never break caller
    console.error("[notify] failed to create notification:", err);
  }
}

// ─── Server Actions ───────────────────────────────────────────────────────────

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function listMyNotifications(opts?: {
  unreadOnly?: boolean;
  limit?: number;
}): Promise<NotificationRow[]> {
  const session = await requireSession();
  const userId = session.user.id;
  const limit = opts?.limit ?? 20;

  const notifications = await rawDb.inAppNotification.findMany({
    where: {
      userId,
      ...(opts?.unreadOnly ? { readAt: null } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return notifications.map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    link: n.link,
    readAt: n.readAt,
    createdAt: n.createdAt,
  }));
}

export async function countUnreadNotifications(): Promise<number> {
  const session = await requireSession();
  return rawDb.inAppNotification.count({
    where: { userId: session.user.id, readAt: null },
  });
}

export async function markRead(ids: string[]): Promise<{ ok: boolean }> {
  const session = await requireSession();
  if (ids.length === 0) return { ok: true };

  await rawDb.inAppNotification.updateMany({
    where: { id: { in: ids }, userId: session.user.id },
    data: { readAt: new Date() },
  });
  return { ok: true };
}

export async function markAllRead(): Promise<{ ok: boolean }> {
  const session = await requireSession();

  await rawDb.inAppNotification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}
