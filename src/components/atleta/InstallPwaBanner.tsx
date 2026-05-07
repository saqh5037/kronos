"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "kronos-pwa-dismissed";
const DISMISS_DAYS = 7;

function isDismissExpired(): boolean {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return true;
  const timestamp = Number(raw);
  if (isNaN(timestamp)) return true;
  const days = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  return days > DISMISS_DAYS;
}

export default function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isDismissExpired()) {
      setDismissed(false);
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const safari = /safari/i.test(navigator.userAgent);
    setIsIos(ios && safari);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Small delay for entrance animation
    const timer = setTimeout(() => setVisible(true), 300);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
    setTimeout(() => setDismissed(true), 300);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
      setVisible(false);
      setTimeout(() => setDismissed(true), 300);
    }
  }

  if (dismissed || isStandalone) return null;
  if (!deferredPrompt && !isIos) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95, height: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="mx-3.5 mt-3 mb-1 rounded-2xl p-3.5 flex items-start gap-3 overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, var(--card) 0%, var(--k-elevated) 100%)",
            border: "1px solid var(--line)",
          }}
        >
          {/* Device icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "var(--k-accent-soft)",
              border: "1px solid var(--fire-line)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--k-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-[var(--text)] mb-0.5">
              Instalar Kronos
            </div>
            {isIos ? (
              <div className="text-[11px] leading-relaxed text-[var(--k-t3)]">
                Toca{" "}
                <span className="font-bold text-[var(--k-warning)]">
                  Compartir
                </span>{" "}
                (icono cuadrado con flecha) y luego{" "}
                <span className="font-bold text-[var(--k-warning)]">
                  Agregar a inicio
                </span>
                .
              </div>
            ) : (
              <div className="text-[11px] text-[var(--k-t3)]">
                Acceso rápido desde tu pantalla de inicio. Funciona sin
                conexión.
              </div>
            )}
          </div>

          <div className="flex gap-1.5 shrink-0">
            {!isIos && deferredPrompt && (
              <motion.button
                onClick={handleInstall}
                className="k-btn-grad text-[11px] px-3 py-1.5 rounded-lg font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Instalar
              </motion.button>
            )}
            <button
              onClick={dismiss}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--k-t3)] hover:text-[var(--k-t2)] hover:bg-[var(--k-elevated)] transition-colors"
              aria-label="Cerrar"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 2L12 12M12 2L2 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
