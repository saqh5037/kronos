"use client";

import { useEffect } from "react";

/**
 * Registers the Kronos service worker.
 * Renders nothing — side-effect only.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[pwa] SW registered, scope:", reg.scope);
      })
      .catch((err) => {
        console.warn("[pwa] SW registration failed:", err);
      });
  }, []);

  return null;
}
