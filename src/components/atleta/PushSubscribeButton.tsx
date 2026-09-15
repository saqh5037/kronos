"use client";

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Bell, Check, Lock } from "lucide-react";

export type PushStatus =
  | "idle"
  | "requesting"
  | "subscribed"
  | "denied"
  | "unsupported";

export type PushEvent = "request" | "granted" | "rejected" | "error";

/** Browser capability snapshot, read once after mount — never during render. */
export type PushEnvSnapshot = {
  hasNotification: boolean;
  hasServiceWorker: boolean;
  permission: NotificationPermission | null;
};

/**
 * SSR / first-client-render seed.
 *
 * MUST stay constant. The previous implementation seeded `useState` from
 * `Notification.permission` and `"serviceWorker" in navigator`, so the server
 * rendered "idle" while the client's first render produced
 * "subscribed"/"denied"/"unsupported" — React then discarded and regenerated
 * the whole `/atleta/perfil` tree (visible CLS on a 4,085px page).
 * See CLAUDE.md "Hydration patterns" and the 2026-09-15 technical audit §C.
 */
export function initialPushState(): PushStatus {
  return "idle";
}

/** Pure: maps a capability snapshot to the real post-mount status. */
export function resolvePushState(env: PushEnvSnapshot): PushStatus {
  if (!env.hasNotification || !env.hasServiceWorker) return "unsupported";
  if (env.permission === "granted") return "subscribed";
  if (env.permission === "denied") return "denied";
  return "idle";
}

/** Pure subscribe-flow state machine. */
export function nextPushState(
  current: PushStatus,
  event: PushEvent,
): PushStatus {
  if (current === "unsupported") return current;
  switch (event) {
    case "request":
      return current === "idle" ? "requesting" : current;
    case "granted":
      return current === "requesting" ? "subscribed" : current;
    case "rejected":
      return current === "requesting" ? "denied" : current;
    case "error":
      return current === "requesting" ? "idle" : current;
    default:
      return current;
  }
}

function readPushEnv(): PushEnvSnapshot {
  const hasNotification =
    typeof window !== "undefined" && "Notification" in window;
  const hasServiceWorker =
    typeof navigator !== "undefined" && "serviceWorker" in navigator;
  return {
    hasNotification,
    hasServiceWorker,
    permission: hasNotification ? Notification.permission : null,
  };
}

export default function PushSubscribeButton() {
  const [status, setStatus] = useState<PushStatus>(initialPushState);
  const [showHelp, setShowHelp] = useState(false);

  // Resolve the real permission state only after mount, so the server HTML and
  // the client's first render agree.
  useEffect(() => {
    setStatus(resolvePushState(readPushEnv()));
  }, []);

  async function subscribe() {
    if (nextPushState(status, "request") === status) return;
    setStatus((s) => nextPushState(s, "request"));

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus((s) => nextPushState(s, "rejected"));
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setStatus((s) => nextPushState(s, "granted"));
        return;
      }

      const urlB64 = vapidPublicKey.replace(/-/g, "+").replace(/_/g, "/");
      const padding = "=".repeat((4 - (urlB64.length % 4)) % 4);
      const base64 = urlB64 + padding;
      const rawData = atob(base64);
      const key = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) key[i] = rawData.charCodeAt(i);

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });

      const { endpoint, keys } = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, keys }),
      });

      setStatus((s) => nextPushState(s, "granted"));
    } catch (err) {
      console.error("[push] subscribe error:", err);
      setStatus((s) => nextPushState(s, "error"));
    }
  }

  if (status === "unsupported") return null;

  return (
    <AnimatePresence mode="wait">
      {status === "subscribed" && (
        <m.div
          key="subscribed"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[var(--k-accent-soft)] border border-[var(--k-accent-line)] flex items-center justify-center">
              <Check
                size={14}
                strokeWidth={2.5}
                color="var(--k-accent)"
                aria-hidden
              />
            </div>
            <span className="absolute inset-0 rounded-full border border-[var(--k-accent)] opacity-30 animate-ping" />
          </div>
          <span className="text-xs font-semibold text-[var(--k-accent)]">
            Notificaciones activadas
          </span>
        </m.div>
      )}

      {status === "denied" && (
        <m.div
          key="denied"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-[11px] text-[var(--k-t3)] leading-relaxed"
        >
          <p className="flex items-center gap-1.5">
            <Lock size={12} aria-hidden />
            Notificaciones bloqueadas.
          </p>
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            aria-expanded={showHelp}
            className="mt-1 underline text-[var(--k-accent)]"
          >
            {showHelp ? "Ocultar ayuda" : "Cómo habilitarlas"}
          </button>
          {showHelp && (
            <p className="mt-1 text-[var(--k-t2)]">
              Abre los ajustes de tu navegador (el candado junto a la dirección)
              y permite las notificaciones para Kronos.
            </p>
          )}
        </m.div>
      )}

      {(status === "idle" || status === "requesting") && (
        <m.button
          key="idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={subscribe}
          disabled={status === "requesting"}
          className="k-btn-grad text-xs px-4 py-2.5 rounded-xl font-semibold w-full flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ minHeight: 44 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Bell size={16} aria-hidden />
          {status === "requesting" ? "Activando..." : "Activar notificaciones"}
        </m.button>
      )}
    </AnimatePresence>
  );
}
