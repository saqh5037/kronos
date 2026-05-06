"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
        setStatus("subscribed");
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

      setStatus("subscribed");
    } catch (err) {
      console.error("[push] subscribe error:", err);
      setStatus("idle");
    }
  }

  if (status === "unsupported") return null;

  return (
    <AnimatePresence mode="wait">
      {status === "subscribed" && (
        <motion.div
          key="subscribed"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[var(--moss-soft)] border border-[var(--moss-line)] flex items-center justify-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--moss)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="absolute inset-0 rounded-full border border-[var(--moss)] opacity-30 animate-ping" />
          </div>
          <span className="text-xs font-semibold text-[var(--moss)]">
            Notificaciones activadas
          </span>
        </motion.div>
      )}

      {status === "denied" && (
        <motion.div
          key="denied"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-[11px] text-[var(--text-3)] leading-relaxed"
        >
          <p>Notificaciones bloqueadas.</p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert(
                "Habilita las notificaciones en los ajustes de tu navegador (icono 🔒 en la barra de dirección).",
              );
            }}
            className="text-[var(--strain)] hover:underline"
          >
            ¿Cómo habilitar?
          </a>
        </motion.div>
      )}

      {(status === "idle" || status === "requesting") && (
        <motion.button
          key="idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={subscribe}
          disabled={status === "requesting"}
          className="k-btn-grad text-xs px-4 py-2.5 rounded-xl font-semibold w-full flex items-center justify-center gap-2 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
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
        </motion.button>
      )}
    </AnimatePresence>
  );
}
