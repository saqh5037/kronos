"use client";

import { useState, useTransition } from "react";
import { generatePilotBetaTokenForBox } from "@/server/actions/super-pilotos";
import { kToast } from "@/lib/toast";
import { formatDateShort } from "@/lib/format";
import { Check, Link2, X } from "lucide-react";

type CopyState = "idle" | "copied" | "error";

export default function CopyMagicLinkButton({ boxId }: { boxId: string }) {
  const [state, setState] = useState<CopyState>("idle");
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await generatePilotBetaTokenForBox({ boxId });
      if (!result.ok) {
        const messages: Record<typeof result.error, string> = {
          UNAUTHORIZED: "Acceso restringido a super-admins",
          BOX_NOT_FOUND: "Box no encontrado",
          NOT_PILOT: "Este Box no es piloto",
          MISSING_SECRET:
            "Falta configurar la firma de enlaces en el servidor. Avisa al equipo de plataforma.",
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
          `Enlace copiado · vence el ${formatDateShort(result.expiresAt)}`,
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
      ? "Copiado"
      : state === "error"
        ? "No se pudo copiar"
        : pending
          ? "Generando…"
          : "Copiar enlace de firma";

  const Icon = state === "copied" ? Check : state === "error" ? X : Link2;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50"
      style={{
        background:
          state === "copied" ? "var(--k-accent-soft)" : "var(--k-elevated)",
        color: state === "copied" ? "var(--k-accent)" : "var(--k-t2)",
        border: `1px solid ${state === "copied" ? "var(--k-accent-line)" : "var(--k-line-2)"}`,
      }}
    >
      <Icon size={13} strokeWidth={2.4} aria-hidden />
      {label}
    </button>
  );
}
