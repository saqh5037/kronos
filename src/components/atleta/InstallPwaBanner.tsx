"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Detects beforeinstallprompt (Android/Chrome) and shows "Install app" banner.
 * On iOS Safari (not standalone), shows manual instructions.
 * Dismissable — stores dismissed state in sessionStorage.
 */
export default function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("kronos-pwa-dismissed") === "1") {
      setDismissed(true);
      return;
    }

    // Check if already installed as standalone
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const safari = /safari/i.test(navigator.userAgent);
    setIsIos(ios && safari);

    // Listen for Chrome/Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    sessionStorage.setItem("kronos-pwa-dismissed", "1");
    setDismissed(true);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
      setDismissed(true);
    }
  }

  if (dismissed || isStandalone) return null;

  // Nothing to show — no prompt available and not iOS
  if (!deferredPrompt && !isIos) return null;

  return (
    <div
      className="mx-3.5 mt-3 mb-1 rounded-[14px] p-3.5 flex items-start gap-3"
      style={{
        background: "var(--card)",
        border: "1px solid var(--strain-line)",
      }}
    >
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 font-display font-extrabold text-sm text-[#1c1917]"
        style={{ background: "var(--grad)" }}
      >
        K
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold mb-0.5">Instalar Kronos</div>
        {isIos ? (
          <div
            className="text-[11px] leading-relaxed"
            style={{ color: "var(--text-2)" }}
          >
            Toca{" "}
            <span className="font-bold" style={{ color: "var(--strain)" }}>
              Compartir
            </span>{" "}
            (icono cuadrado con flecha) y luego{" "}
            <span className="font-bold" style={{ color: "var(--strain)" }}>
              Agregar a inicio
            </span>
            .
          </div>
        ) : (
          <div className="text-[11px]" style={{ color: "var(--text-2)" }}>
            Acceso rápido desde tu pantalla de inicio
          </div>
        )}
      </div>
      <div className="flex gap-1.5 shrink-0">
        {!isIos && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="k-btn-grad text-[11px] px-3 py-1.5 rounded-[8px] font-semibold"
          >
            Instalar
          </button>
        )}
        <button
          onClick={dismiss}
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "var(--bg-soft)", color: "var(--text-3)" }}
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    </div>
  );
}
