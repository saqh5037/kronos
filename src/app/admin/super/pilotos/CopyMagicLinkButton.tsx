"use client";

import { useState, useTransition } from "react";
import { generatePilotBetaTokenForBox } from "@/server/actions/super-pilotos";
import { kToast } from "@/lib/toast";

type CopyState = "idle" | "copied" | "error";

export default function CopyMagicLinkButton({ boxId }: { boxId: string }) {
  const [state, setState] = useState<CopyState>("idle");
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await generatePilotBetaTokenForBox({ boxId });
      if (!result.ok) {
        const messages: Record<typeof result.error, string> = {
          BOX_NOT_FOUND: "Box no encontrado",
          NOT_PILOT: "Este Box no es piloto",
          MISSING_SECRET: "PILOT_BETA_TOKEN_SECRET no configurado en server",
        };
        kToast.error(messages[result.error]);
        setState("error");
        setTimeout(() => setState("idle"), 2000);
        return;
      }
      try {
        await navigator.clipboard.writeText(result.url);
        setState("copied");
        kToast.success(
          `Link copiado · expira ${result.expiresAt.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`,
        );
        setTimeout(() => setState("idle"), 2500);
      } catch {
        kToast.error("No se pudo copiar al clipboard");
        setState("error");
        setTimeout(() => setState("idle"), 2000);
      }
    });
  }

  const label =
    state === "copied"
      ? "✓ Copiado"
      : state === "error"
        ? "✗ Error"
        : pending
          ? "Generando…"
          : "Copiar link de firma";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      style={{
        background:
          state === "copied" ? "var(--k-accent-soft)" : "var(--k-elevated)",
        color: state === "copied" ? "var(--k-accent)" : "var(--k-t2)",
        border: `1px solid ${state === "copied" ? "var(--k-accent-line)" : "var(--k-line-2)"}`,
      }}
    >
      {label}
    </button>
  );
}
