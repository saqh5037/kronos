/**
 * Web Push helpers for Kronos.
 * Requires env vars: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 * Generate keys: npx web-push generate-vapid-keys
 */
import webpush from "web-push";
import { db as rawDb } from "./db";

let vapidInitialized = false;

function ensureVapid() {
  if (vapidInitialized) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hola@kronos.app";

  if (!publicKey || !privateKey) {
    // No VAPID keys configured — push is disabled. Not an error in dev.
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidInitialized = true;
}

export type PushPayload = {
  title: string;
  body: string;
  link?: string;
  icon?: string;
};

/**
 * Sends a web push notification to all subscriptions for a user.
 * Best-effort: never throws. Removes stale subscriptions (HTTP 410).
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  ensureVapid();
  if (!vapidInitialized) return; // VAPID not configured — skip silently

  try {
    const subscriptions = await rawDb.pushSubscription.findMany({
      where: { userId },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });

    if (subscriptions.length === 0) return;

    const data = JSON.stringify({
      title: payload.title,
      body: payload.body,
      link: payload.link ?? "/atleta",
      icon: payload.icon ?? "/icons/icon-192.png",
    });

    const staleIds: string[] = [];

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            data,
          );
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            // Subscription is gone — mark for cleanup
            staleIds.push(sub.id);
          } else {
            console.error("[push] sendNotification error:", err);
          }
        }
      }),
    );

    if (staleIds.length > 0) {
      await rawDb.pushSubscription.deleteMany({
        where: { id: { in: staleIds } },
      });
    }
  } catch (err) {
    // Best-effort — never let push failure bubble up
    console.error("[push] sendPushToUser failed:", err);
  }
}
