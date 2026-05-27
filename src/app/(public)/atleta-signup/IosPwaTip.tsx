"use client";

import { useEffect, useState } from "react";
import { detectPwaPlatform, buildSafariDeepLink } from "@/lib/pwa-detect";

type Mode = "ios-safari-not-installed" | "ios-other" | "hidden";

/**
 * Banner contextual NO bloqueante mostrado encima del form de signup.
 *
 * - iOS Safari y NO standalone → tip "Instalá la app primero (mejor UX)"
 *   con instrucciones colapsables.
 * - iOS Chrome/Firefox/etc → tip "Esto es Chrome, mejor en Safari" con
 *   botón "Abrir en Safari".
 * - Resto (Android, desktop, iOS standalone ya instalado) → no se muestra.
 */
export default function IosPwaTip() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const platform = detectPwaPlatform(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;

    if (standalone) return; // ya está instalado, nada que mostrar
    if (platform === "ios-safari") setMode("ios-safari-not-installed");
    else if (platform === "ios-other") setMode("ios-other");
  }, []);

  function openInSafari() {
    if (typeof window === "undefined") return;
    window.location.href = buildSafariDeepLink(window.location.href);
  }

  if (mode === "hidden") return null;

  return (
    <div
      className="rounded-xl border p-3 mb-4"
      style={{
        background: "var(--k-accent-soft)",
        borderColor: "var(--k-accent-line)",
      }}
    >
      {mode === "ios-other" ? (
        <div className="space-y-2">
          <p className="text-xs font-bold" style={{ color: "var(--k-accent)" }}>
            📱 Estás en Chrome iPhone
          </p>
          <p
            className="text-[11px] leading-relaxed"
            style={{ color: "var(--k-t2)" }}
          >
            Apple solo permite instalar apps desde Safari. Te recomendamos abrir
            Kronos en Safari antes de registrarte.
          </p>
          <button
            type="button"
            onClick={openInSafari}
            className="k-btn-grad text-[11px] px-3 py-1.5 rounded-lg font-semibold w-full"
          >
            Abrir en Safari →
          </button>
          <p
            className="text-[10px] text-center"
            style={{ color: "var(--k-t3)" }}
          >
            (también puedes seguir acá y crear contraseña abajo)
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowInstructions((s) => !s)}
            className="w-full flex items-center justify-between text-left"
          >
            <p
              className="text-xs font-bold"
              style={{ color: "var(--k-accent)" }}
            >
              💡 Tip: instalá Kronos primero (mejor UX)
            </p>
            <span style={{ color: "var(--k-accent)", fontSize: 14 }}>
              {showInstructions ? "−" : "+"}
            </span>
          </button>
          {showInstructions ? (
            <div className="space-y-1.5 pt-1">
              <p
                className="text-[11px] leading-relaxed"
                style={{ color: "var(--k-t2)" }}
              >
                1. Tocá el botón{" "}
                <strong style={{ color: "var(--k-warning)" }}>Compartir</strong>{" "}
                de Safari (icono ⬆ abajo)
                <br />
                2. Bajá y tocá{" "}
                <strong style={{ color: "var(--k-warning)" }}>
                  Agregar a inicio
                </strong>
                <br />
                3. Vuelve y regístrate desde la app instalada
              </p>
              <p className="text-[10px] pt-1" style={{ color: "var(--k-t3)" }}>
                Si prefieres seguir sin instalar, también funciona —
                recomendamos crear contraseña abajo.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
