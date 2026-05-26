"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  findBoxBySupportCode,
  openSupportSession,
} from "@/server/actions/support";

type BoxPreview = {
  id: string;
  name: string;
  slug: string;
  subscriptionStatus: string;
  athleteCount: number;
  ownerEmail: string | null;
  verificationToken: string;
};

const STATUS_LABELS: Record<string, string> = {
  TRIAL: "Trial",
  ACTIVE: "Activo",
  PAST_DUE: "Vencido",
  CANCELLED: "Cancelado",
  EXPIRED: "Expirado",
};

const STATUS_COLORS: Record<string, string> = {
  TRIAL: "var(--k-warning)",
  ACTIVE: "var(--k-accent)",
  PAST_DUE: "var(--k-danger)",
  CANCELLED: "var(--k-danger)",
  EXPIRED: "var(--k-t3)",
};

export function CodeEntryForm({
  expiredSession,
}: {
  expiredSession?: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BoxPreview | null>(null);
  const [step, setStep] = useState<"input" | "confirm">("input");
  const [isPending, startTransition] = useTransition();

  function handleCodeChange(v: string) {
    // Auto-format: uppercase, insert dash after 3 chars if not already
    const raw = v.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    setCode(raw);
    // Reset if user is typing again
    if (step === "confirm") {
      setStep("input");
      setPreview(null);
    }
    setError(null);
  }

  function handleSearch() {
    if (!code.trim()) return;
    setError(null);
    setPreview(null);

    startTransition(async () => {
      const result = await findBoxBySupportCode(code.trim());
      if (!result.ok) {
        if (result.error === "RATE_LIMITED") {
          setError(
            "Demasiados intentos. Espera unos minutos antes de intentar de nuevo.",
          );
        } else {
          setError(
            "Código no válido. Verifica que el cliente te lo esté dictando bien.",
          );
        }
        return;
      }
      setPreview({
        ...result.box,
        verificationToken: result.verificationToken,
      });
      setStep("confirm");
    });
  }

  function handleConfirm() {
    if (!preview) return;
    startTransition(async () => {
      const result = await openSupportSession(
        preview.id,
        preview.verificationToken,
      );
      if (!result.ok) {
        setError("No se pudo abrir la sesión. Intenta de nuevo.");
        setStep("input");
        setPreview(null);
        return;
      }
      router.refresh();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSearch();
  }

  return (
    <div className="mx-auto max-w-lg">
      {expiredSession && (
        <div
          className="mb-6 rounded-xl border px-4 py-3 text-sm"
          style={{
            background: "rgba(255, 176, 32, 0.08)",
            borderColor: "rgba(255, 176, 32, 0.3)",
            color: "var(--k-warning)",
          }}
        >
          La sesión de soporte expiró. Pide el código de nuevo al cliente.
        </div>
      )}

      <div
        className="k-card p-6"
        style={{ borderTop: "3px solid var(--k-warning)" }}
      >
        <p className="k-eyebrow mb-1" style={{ color: "var(--k-warning)" }}>
          Sesion de soporte
        </p>
        <h2
          className="mb-4 font-display text-xl font-bold"
          style={{ color: "var(--k-t1)" }}
        >
          Buscar box por código
        </h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="KRN-XXXX"
            maxLength={12}
            disabled={isPending}
            className="flex-1 rounded-xl border bg-[var(--k-elevated)] px-4 py-2.5 font-mono text-sm font-bold uppercase tracking-widest text-[var(--k-t1)] placeholder:text-[var(--k-t3)] focus:outline-none focus:ring-2 disabled:opacity-50"
            style={{
              borderColor: error ? "var(--k-danger)" : "var(--k-line-2)",
            }}
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={isPending || !code.trim()}
            className="rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-40"
            style={{
              background: "rgba(255, 176, 32, 0.15)",
              color: "var(--k-warning)",
              border: "1px solid rgba(255, 176, 32, 0.4)",
            }}
          >
            {isPending && step === "input" ? "Buscando…" : "Buscar box"}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm" style={{ color: "var(--k-danger)" }}>
            {error}
          </p>
        )}

        {step === "confirm" && preview && (
          <div className="mt-5">
            <div
              className="k-card-flat mb-4 p-4"
              style={{ borderLeft: "3px solid var(--k-warning)" }}
            >
              <p
                className="mb-2 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--k-warning)" }}
              >
                Box encontrado
              </p>
              <p
                className="mb-1 text-lg font-bold"
                style={{ color: "var(--k-t1)" }}
              >
                {preview.name}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span style={{ color: "var(--k-t2)" }}>
                  Slug:{" "}
                  <span className="font-mono" style={{ color: "var(--k-t1)" }}>
                    {preview.slug}
                  </span>
                </span>
                <span>
                  Estado:{" "}
                  <span
                    className="font-semibold"
                    style={{
                      color:
                        STATUS_COLORS[preview.subscriptionStatus] ??
                        "var(--k-t2)",
                    }}
                  >
                    {STATUS_LABELS[preview.subscriptionStatus] ??
                      preview.subscriptionStatus}
                  </span>
                </span>
                <span style={{ color: "var(--k-t2)" }}>
                  Atletas:{" "}
                  <span
                    className="font-mono font-bold"
                    style={{ color: "var(--k-t1)" }}
                  >
                    {preview.athleteCount}
                  </span>
                </span>
                {preview.ownerEmail && (
                  <span style={{ color: "var(--k-t2)" }}>
                    Owner:{" "}
                    <span style={{ color: "var(--k-t1)" }}>
                      {preview.ownerEmail}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <p className="mb-3 text-sm" style={{ color: "var(--k-t2)" }}>
              ¿Quieres abrir una sesión de soporte para{" "}
              <strong style={{ color: "var(--k-t1)" }}>{preview.name}</strong>?
              La sesión expira en 30 minutos.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-40"
                style={{
                  background: "rgba(255, 176, 32, 0.15)",
                  color: "var(--k-warning)",
                  border: "1px solid rgba(255, 176, 32, 0.4)",
                }}
              >
                {isPending ? "Abriendo sesión…" : "Sí, abrir sesión"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("input");
                  setPreview(null);
                  setCode("");
                }}
                className="k-btn-ghost px-4 py-2.5 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs" style={{ color: "var(--k-t3)" }}>
        Esta sección solo es visible para super-admins. Todas las acciones
        quedan en el log de auditoría.
      </p>
    </div>
  );
}
