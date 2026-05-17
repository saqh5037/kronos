"use client";

import { useEffect, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { kToast } from "@/lib/toast";
import OtpInput from "./OtpInput";

/**
 * Pantalla "esperando email" — modo OTP por default.
 *
 * Modo OTP (default): input 6 dígitos con autofill iOS nativo. Al completar,
 * dispara fetch a /api/auth/otp/verify y redirige rol-aware. El código vive
 * 1h y es reusable los primeros 5 min post-primer-uso (cross-browser).
 *
 * Modo link (fallback opcional): magic link tradicional para los que prefieran.
 *
 * Pre-fill: si la URL trae ?code=XXXXXX (vía /atleta/otp-redirect), arranca
 * en modo OTP con el código pre-cargado.
 *
 * Pie con WhatsApp soporte visible en cualquier modo.
 */

type Props = {
  email: string;
  /** Copy del título. Cambia según contexto (signup nuevo vs ya tiene cuenta). */
  title?: string;
  /** Subtítulo descriptivo arriba del flow. */
  subtitle?: React.ReactNode;
};

const RESEND_COOLDOWN_SECONDS = 30;
const WHATSAPP_SUPPORT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT ?? "";

export default function MagicLinkWaiting({ email, title, subtitle }: Props) {
  const [mode, setMode] = useState<"link" | "otp">("otp");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [resendCooldown, setResendCooldown] = useState<number>(
    RESEND_COOLDOWN_SECONDS,
  );
  const [resendBusy, setResendBusy] = useState(false);

  // Pre-fill desde ?code= en URL (caso flow /atleta/otp-redirect que cae acá
  // si la verificación auto falla y queremos que el atleta confirme manual).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get("code");
    if (prefill && /^\d{6}$/.test(prefill)) {
      setCode(prefill);
      setMode("otp");
    }
  }, []);

  // Cooldown de reenvío. Se resetea al volver a 30 cuando el user reenvía.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function handleResend() {
    if (resendCooldown > 0 || resendBusy) return;
    setResendBusy(true);
    try {
      await signIn("email", { email, redirect: false });
      kToast.success("Te mandamos un nuevo email");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setError(null);
    } catch {
      kToast.error("No pudimos reenviar. Intenta de nuevo.");
    } finally {
      setResendBusy(false);
    }
  }

  function handleVerify(submittedCode: string) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, code: submittedCode }),
        });
        const data: { ok?: boolean; redirectTo?: string; message?: string } =
          await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          setError(data.message ?? "Código inválido");
          return;
        }
        const target =
          typeof data.redirectTo === "string" ? data.redirectTo : "/atleta";
        window.location.href = target;
      } catch {
        setError("Error de conexión. Intenta de nuevo.");
      }
    });
  }

  return (
    <div className="space-y-4 text-center">
      <div
        className="inline-flex items-center justify-center w-12 h-12 rounded-full"
        style={{ background: "var(--k-accent-soft)" }}
      >
        <span
          className="font-display font-bold text-xl"
          style={{ color: "var(--k-accent)" }}
        >
          ✓
        </span>
      </div>
      <h2 className="font-display font-bold text-xl">
        {title ?? "Revisa tu correo"}
      </h2>

      {subtitle ? (
        <div className="text-sm" style={{ color: "var(--k-t2)" }}>
          {subtitle}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--k-t2)" }}>
          Te mandamos un código de 6 dígitos a{" "}
          <strong style={{ color: "var(--k-t1)" }}>{email}</strong>. Pégalo
          abajo para entrar.
        </p>
      )}

      {mode === "otp" ? (
        <div className="space-y-3 pt-2">
          <p
            className="text-xs font-mono uppercase tracking-wider"
            style={{ color: "var(--k-t3)" }}
          >
            Pega los 6 dígitos del email
          </p>
          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v);
              if (error) setError(null);
            }}
            onComplete={handleVerify}
            disabled={pending}
            autoFocus
          />
          {error ? (
            <p
              className="text-xs"
              style={{ color: "var(--k-danger, #ff5a5a)" }}
            >
              {error}
            </p>
          ) : null}
          {pending ? (
            <p className="text-xs" style={{ color: "var(--k-t3)" }}>
              Verificando…
            </p>
          ) : null}
          <p className="text-[11px]" style={{ color: "var(--k-t3)" }}>
            El código vive 1 hora. Lo puedes usar en Chrome y Safari los
            primeros 5 minutos.
          </p>
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendBusy}
              className="text-xs disabled:opacity-50"
              style={{ color: "var(--k-t2)" }}
            >
              {resendCooldown > 0
                ? `Reenviar email en ${resendCooldown}s`
                : resendBusy
                  ? "Reenviando…"
                  : "Reenviar email"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("link");
                setError(null);
              }}
              className="text-xs underline"
              style={{ color: "var(--k-t3)" }}
            >
              Prefiero un link mágico
            </button>
          </div>
        </div>
      ) : (
        <>
          <p
            className="text-xs font-mono uppercase tracking-wider"
            style={{ color: "var(--k-t3)" }}
          >
            Magic link
          </p>
          <p className="text-sm" style={{ color: "var(--k-t2)" }}>
            Toca el botón <strong>Entrar a Kronos</strong> en el mail desde el
            mismo dispositivo. El link es válido 1 hora.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setMode("otp");
                setError(null);
              }}
              className="text-sm underline"
              style={{ color: "var(--k-accent)" }}
            >
              ← Volver al código
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendBusy}
              className="text-xs disabled:opacity-50"
              style={{ color: "var(--k-t2)" }}
            >
              {resendCooldown > 0
                ? `Reenviar email en ${resendCooldown}s`
                : resendBusy
                  ? "Reenviando…"
                  : "Reenviar email"}
            </button>
          </div>
        </>
      )}

      {WHATSAPP_SUPPORT_NUMBER ? (
        <p
          className="text-[11px] pt-3 border-t"
          style={{
            color: "var(--k-t3)",
            borderColor: "var(--k-line)",
          }}
        >
          ¿Problemas?{" "}
          <a
            href={`https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${encodeURIComponent(
              `Hola, no puedo entrar a Kronos con ${email}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "var(--k-accent)" }}
          >
            Escríbenos por WhatsApp
          </a>
        </p>
      ) : null}
    </div>
  );
}
