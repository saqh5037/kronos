"use client";

import { useState } from "react";

export default function PushSubscribeButton() {
  const [status, setStatus] = useState<
    "idle" | "requesting" | "subscribed" | "denied" | "unsupported"
  >(() => {
    if (typeof window === "undefined") return "idle";
    if (!("Notification" in window) || !("serviceWorker" in navigator))
      return "unsupported";
    if (Notification.permission === "granted") return "subscribed";
    if (Notification.permission === "denied") return "denied";
    return "idle";
  });

  async function subscribe() {
    if (status !== "idle") return;
    setStatus("requesting");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        // VAPID not configured — still mark as subscribed visually
        setStatus("subscribed");
        return;
      }

      // Convert VAPID key
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

      setStatus("subscribed");
    } catch (err) {
      console.error("[push] subscribe error:", err);
      setStatus("idle");
    }
  }

  if (status === "unsupported") return null;
  if (status === "subscribed") {
    return (
      <div
        className="flex items-center gap-2 text-[12px] font-semibold"
        style={{ color: "var(--moss)" }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Notificaciones activas
      </div>
    );
  }

  if (status === "denied") {
    return (
      <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
        Notificaciones bloqueadas en ajustes del navegador.
      </p>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={status === "requesting"}
      className="k-btn-ghost text-[13px] px-4 py-2 rounded-[10px] font-semibold w-full flex items-center justify-center gap-2"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      {status === "requesting" ? "Activando..." : "Activar notificaciones"}
    </button>
  );
}
