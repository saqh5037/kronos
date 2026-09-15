"use client";

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { EllipsisVertical, Smartphone, X } from "lucide-react";
import {
  detectPwaPlatform,
  buildSafariDeepLink,
  type PwaPlatform,
} from "@/lib/pwa-detect";
import { shouldShowInstallBanner } from "@/lib/pwa-visits";

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
  const [platform, setPlatform] = useState<PwaPlatform>("unknown");
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Gate: solo aparece si el user califica (visits>=3 || onboarded || ?install=1)
    // Y si no fue dismiss reciente.
    const eligible = shouldShowInstallBanner(window.location.search);
    if (eligible && isDismissExpired()) {
      setDismissed(false);
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    setPlatform(detectPwaPlatform(navigator.userAgent));

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

  function handleOpenInSafari() {
    if (typeof window === "undefined") return;
    window.location.href = buildSafariDeepLink(window.location.href);
  }

  if (dismissed || isStandalone) return null;

  // 4 modos según plataforma:
  // - ios-safari: instrucciones "Compartir" y "Agregar a inicio" (puede instalar)
  // - ios-other: Chrome/Firefox/Edge iOS o in-app browser → botón "Abrir en
  //   Safari" porque Apple SOLO deja a Safari instalar PWAs como standalone
  // - android-prompt: tiene beforeinstallprompt → botón nativo "Instalar"
  // - android-manual: Android sin prompt → instrucciones del menú del navegador
  const mode =
    platform === "ios-safari"
      ? "ios-safari"
      : platform === "ios-other"
        ? "ios-other"
        : deferredPrompt
          ? "android-prompt"
          : "android-manual";

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95, height: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="mx-3.5 mb-1 rounded-2xl p-3.5 flex items-start gap-3 overflow-hidden"
          style={{
            // Notch + la campana de notificaciones (fixed, 44px, top 12) viven
            // arriba del banner: 64px lo dejan pasar sin taparse.
            marginTop: "calc(env(safe-area-inset-top, 0px) + 64px)",
            background:
              "linear-gradient(135deg, var(--k-surface) 0%, var(--k-elevated) 100%)",
            border: "1px solid var(--k-line)",
          }}
        >
          {/* Device icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "var(--k-accent-soft)",
              border: "1px solid var(--k-accent-line)",
              color: "var(--k-accent)",
            }}
          >
            <Smartphone size={18} aria-hidden />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-[var(--k-t1)] mb-0.5">
              Instalar Kronos
            </div>
            {mode === "ios-safari" && (
              <div className="text-[11px] leading-relaxed text-[var(--k-t3)]">
                Toca{" "}
                <span className="font-bold text-[var(--k-accent)]">
                  Compartir
                </span>{" "}
                (el cuadro con la flecha) y luego{" "}
                <span className="font-bold text-[var(--k-accent)]">
                  Agregar a inicio
                </span>
                .
              </div>
            )}
            {mode === "ios-other" && (
              <div className="text-[11px] leading-relaxed text-[var(--k-t3)]">
                Apple solo deja a{" "}
                <span className="font-bold text-[var(--k-accent)]">Safari</span>{" "}
                instalar apps. Toca el botón para abrir Kronos en Safari y ahí
                elige{" "}
                <span className="font-bold text-[var(--k-accent)]">
                  Compartir
                </span>{" "}
                y luego{" "}
                <span className="font-bold text-[var(--k-accent)]">
                  Agregar a inicio
                </span>
                .
              </div>
            )}
            {mode === "android-prompt" && (
              <div className="text-[11px] text-[var(--k-t3)]">
                Acceso rápido desde tu pantalla de inicio. Funciona sin
                conexión.
              </div>
            )}
            {mode === "android-manual" && (
              <div className="text-[11px] leading-relaxed text-[var(--k-t3)]">
                Abre el menú{" "}
                <EllipsisVertical
                  size={12}
                  aria-hidden
                  className="inline align-text-bottom text-[var(--k-accent)]"
                />{" "}
                del navegador y toca{" "}
                <span className="font-bold text-[var(--k-accent)]">
                  Instalar app
                </span>{" "}
                o{" "}
                <span className="font-bold text-[var(--k-accent)]">
                  Agregar a inicio
                </span>
                .
              </div>
            )}
          </div>

          <div className="flex gap-1.5 shrink-0">
            {mode === "android-prompt" && (
              <m.button
                onClick={handleInstall}
                className="k-btn-grad text-[11px] px-3 rounded-lg font-semibold"
                style={{ minHeight: 44 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Instalar
              </m.button>
            )}
            {mode === "ios-other" && (
              <m.button
                onClick={handleOpenInSafari}
                className="k-btn-grad text-[11px] px-3 rounded-lg font-semibold whitespace-nowrap"
                style={{ minHeight: 44 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Abrir en Safari
              </m.button>
            )}
            <button
              onClick={dismiss}
              className="rounded-full flex items-center justify-center text-[var(--k-t3)] hover:text-[var(--k-t2)] hover:bg-[var(--k-elevated)] transition-colors"
              style={{ width: 44, height: 44 }}
              aria-label="Cerrar"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
