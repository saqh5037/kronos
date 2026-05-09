"use client";

import { useEffect, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { kToast } from "@/lib/toast";
import { detectPwaPlatform } from "@/lib/pwa-detect";
import OtpInput from "./OtpInput";

/**
 * Pantalla "esperando email" con switch a OTP fallback.
 *
 * Modo default (magic-link): copy "te mandamos un link, abrilo desde tu
 * teléfono", timer de 30s + botón "Reenviar email", link discreto "¿No te
 * llegó? Usar código en su lugar".
 *
 * Modo OTP: input 6 dígitos con autofill iOS nativo. Al alcanzar 6 dígitos
 * dispara fetch a /api/auth/otp/verify. Si OK, redirige a redirectTo del
 * server (rol-aware).
 *
 * Pie con WhatsApp soporte visible en cualquier modo.
 *
 * Para iOS Chrome muestra copy adicional explicando que para instalar la
 * PWA va a necesitar Safari y que el código sirve igual ahí.
 */

type Props = {
  email: string;
  /** Copy del título. Cambia según contexto (signup nuevo vs ya tenés cuenta). */
  title?: string;
  /** Subtítulo descriptivo arriba del flow. */
  subtitle?: React.ReactNode;
};

const RESEND_COOLDOWN_SECONDS = 30;
const WHATSAPP_SUPPORT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT ?? "";

export default function MagicLinkWaiting({ email, title, subtitle }: Props) {
  const [mode, setMode] = useState<"link" | "otp">("link");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [resendCooldown, setResendCooldown] = useState<number>(
    RESEND_COOLDOWN_SECONDS,
  );
  const [resendBusy, setResendBusy] = useState(false);
  const [iosChrome, setIosChrome] = useState(false);
  const [iosSafari, setIosSafari] = useState(false);

  useEffect(() => {
    const platform = detectPwaPlatform(navigator.userAgent);
    setIosChrome(platform === "ios-other");
    setIosSafari(platform === "ios-safari");
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
      kToast.error("No pudimos reenviar. Probá de nuevo.");
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
        setError("Error de conexión. Probá de nuevo.");
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
        {title ?? "Revisá tu correo"}
      </h2>

      {subtitle ? (
        <div className="text-sm" style={{ color: "var(--k-t2)" }}>
          {subtitle}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--k-t2)" }}>
          Te enviamos un enlace mágico a{" "}
          <strong style={{ color: "var(--k-t1)" }}>{email}</strong>. Tocalo
          desde tu teléfono para entrar.
        </p>
      )}

      {iosChrome && mode === "link" ? (
        <div
          className="rounded-xl border p-3 text-left"
          style={{
            background: "var(--k-accent-soft)",
            borderColor: "var(--k-accent-line)",
          }}
        >
          <p
            className="text-xs font-bold mb-1"
            style={{ color: "var(--k-accent)" }}
          >
            ⚠️ Estás en Chrome iOS
          </p>
          <p
            className="text-[11px] leading-relaxed"
            style={{ color: "var(--k-t2)" }}
          >
            Para instalar la app en tu iPhone vas a necesitar Safari. Tip: podés
            abrir Safari, venir a esta misma página, tocar{" "}
            <strong>Usar código</strong> abajo y meter el código del email — sin
            re-loguear.
          </p>
        </div>
      ) : null}

      {mode === "link" ? (
        <>
          <button
            type="button"
            onClick={() => {
              setMode("otp");
              setError(null);
            }}
            className="text-sm underline"
            style={{ color: "var(--k-accent)" }}
          >
            ¿No te llegó el link? Usar código en su lugar →
          </button>
          <div className="flex flex-col gap-2 pt-2">
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
      ) : (
        <div className="space-y-3 pt-2">
          <p
            className="text-xs font-mono uppercase tracking-wider"
            style={{ color: "var(--k-t3)" }}
          >
            Mete el código de 6 dígitos del email
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
              onClick={() => setMode("link")}
              className="text-xs underline"
              style={{ color: "var(--k-t3)" }}
            >
              ← Volver al link
            </button>
          </div>
        </div>
      )}

      {iosSafari && mode === "link" ? (
        <p className="text-[11px]" style={{ color: "var(--k-t3)" }}>
          Tip: una vez adentro vas a poder instalar Kronos como app desde el
          botón Compartir de Safari.
        </p>
      ) : null}

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
            Escribinos por WhatsApp
          </a>
        </p>
      ) : null}
    </div>
  );
}
