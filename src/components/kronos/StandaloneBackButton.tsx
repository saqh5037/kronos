"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

/**
 * Instalada en iOS como PWA, Kronos corre en "standalone": sin barra de URL
 * y sin botón de back del sistema. Una pantalla sin su propia navegación
 * (ej. /admin/billing) se vuelve una trampa sin salida — pasó de verdad.
 *
 * Solo se renderiza cuando (a) el display-mode es standalone Y (b) hay algo
 * en el historial al cual volver. Ambas condiciones se leen en useEffect,
 * nunca en el render: `matchMedia`/`navigator.standalone`/`history.length`
 * no existen durante el render del servidor y leerlos ahí es el bug de
 * hydration que CLAUDE.md prohíbe explícitamente (ver "Hydration patterns").
 */
export default function StandaloneBackButton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches === true ||
      (navigator as NavigatorWithStandalone).standalone === true;
    const hasHistory = window.history.length > 1;
    setVisible(isStandalone && hasHistory);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Volver"
      className={className}
      style={{
        position: "fixed",
        left: 12,
        bottom: "max(calc(env(safe-area-inset-bottom) + 12px), 16px)",
        zIndex: 25,
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: "1px solid var(--k-line)",
        background: "rgba(15,16,20,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--k-t1)",
        cursor: "pointer",
        ...style,
      }}
    >
      <ArrowLeft size={20} strokeWidth={2.2} aria-hidden />
    </button>
  );
}
