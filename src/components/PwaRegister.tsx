"use client";

import { useEffect } from "react";

/**
 * Registers the Kronos service worker.
 * - Auto-update check en cada montada (`reg.update()`).
 * - Si hay un waiting worker (versión nueva ya descargada), lo activa
 *   inmediatamente con `postMessage("SKIP_WAITING")`.
 *
 * Renders nothing — side-effect only.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Trigger un check de update para captar nuevos deploys del SW.
        reg.update().catch(() => {});

        // Si ya hay un worker waiting (hubo update entre cargas), activarlo.
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // Listener para próximos updates: cuando un nuevo worker entra en
        // installed y hay controller actual → tomar control sin reload manual.
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch((err) => {
        console.warn("[pwa] SW registration failed:", err);
      });
  }, []);

  return null;
}
