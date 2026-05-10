"use client";

import { useEffect, useState } from "react";
import KCard from "@/components/kronos/KCard";

type Props = {
  code?: string;
  email?: string;
};

type Status = "verifying" | "ok" | "error" | "missing-params";

export default function OtpRedirectClient({ code, email }: Props) {
  const [status, setStatus] = useState<Status>(
    code && email ? "verifying" : "missing-params",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !email) return;
    let cancelled = false;

    // Best-effort copy al portapapeles (requires HTTPS + user gesture en iOS;
    // el tap del link cuenta como gesture).
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {
        // Silencioso — clipboard puede fallar en contextos no-HTTPS o por
        // permission denial. El login auto sigue funcionando igual.
      });
    }

    (async () => {
      try {
        const res = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
        const data: {
          ok?: boolean;
          redirectTo?: string;
          message?: string;
        } = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (res.ok && data.ok) {
          setStatus("ok");
          const target =
            typeof data.redirectTo === "string" ? data.redirectTo : "/atleta";
          window.location.href = target;
          return;
        }

        // Verificación falló — mandar al login con email + code para que el
        // atleta complete manualmente (el código sigue válido si está dentro
        // de la ventana de gracia).
        setStatus("error");
        setErrorMessage(data.message ?? "No pudimos validar el código.");
        const params = new URLSearchParams();
        if (email) params.set("email", email);
        if (code) params.set("code", code);
        const fallback = `/login?${params.toString()}`;
        // Pequeño delay para que el usuario alcance a leer el mensaje.
        setTimeout(() => {
          if (!cancelled) window.location.href = fallback;
        }, 1500);
      } catch {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage("Error de conexión. Te llevamos al login.");
        setTimeout(() => {
          if (!cancelled) window.location.href = "/login";
        }, 1500);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, email]);

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--k-bg)" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 border"
            style={{
              background: "var(--k-surface)",
              borderColor: "var(--k-line-2)",
            }}
          >
            <span
              className="font-display font-bold text-2xl"
              style={{ color: "var(--k-accent)" }}
            >
              K
            </span>
          </div>
          <h1
            className="font-display font-bold text-2xl"
            style={{ color: "var(--k-t1)" }}
          >
            Kronos
          </h1>
        </div>

        <KCard>
          <div className="space-y-4 text-center py-2">
            {status === "verifying" ? (
              <>
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full k-pulse-glow"
                  style={{ background: "var(--k-accent-soft)" }}
                >
                  <span
                    className="font-display font-bold text-xl"
                    style={{ color: "var(--k-accent)" }}
                  >
                    →
                  </span>
                </div>
                <h2
                  className="font-display font-bold text-xl"
                  style={{ color: "var(--k-t1)" }}
                >
                  Entrando a Kronos…
                </h2>
                <p className="text-sm" style={{ color: "var(--k-t2)" }}>
                  Copiamos tu código al portapapeles y estamos validando tu
                  sesión.
                </p>
              </>
            ) : null}

            {status === "ok" ? (
              <>
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
                <h2
                  className="font-display font-bold text-xl"
                  style={{ color: "var(--k-t1)" }}
                >
                  Listo
                </h2>
                <p className="text-sm" style={{ color: "var(--k-t2)" }}>
                  Te llevamos a Kronos…
                </p>
              </>
            ) : null}

            {status === "error" ? (
              <>
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full"
                  style={{
                    background: "rgba(255, 90, 90, 0.1)",
                    border: "1px solid rgba(255, 90, 90, 0.3)",
                  }}
                >
                  <span
                    className="font-display font-bold text-xl"
                    style={{ color: "var(--k-danger, #ff5a5a)" }}
                  >
                    !
                  </span>
                </div>
                <h2
                  className="font-display font-bold text-xl"
                  style={{ color: "var(--k-t1)" }}
                >
                  No pudimos auto-loguearte
                </h2>
                <p className="text-sm" style={{ color: "var(--k-t2)" }}>
                  {errorMessage ?? "Te llevamos al login para reintentar."}
                </p>
              </>
            ) : null}

            {status === "missing-params" ? (
              <>
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full"
                  style={{
                    background: "rgba(255, 176, 32, 0.1)",
                    border: "1px solid rgba(255, 176, 32, 0.3)",
                  }}
                >
                  <span
                    className="font-display font-bold text-xl"
                    style={{ color: "var(--k-warning, #ffb020)" }}
                  >
                    ?
                  </span>
                </div>
                <h2
                  className="font-display font-bold text-xl"
                  style={{ color: "var(--k-t1)" }}
                >
                  Falta info
                </h2>
                <p className="text-sm" style={{ color: "var(--k-t2)" }}>
                  Este link no trae código. Andá al login para pedir uno nuevo.
                </p>
                <a
                  href="/login"
                  className="inline-block text-sm underline pt-2"
                  style={{ color: "var(--k-accent)" }}
                >
                  Ir al login →
                </a>
              </>
            ) : null}
          </div>
        </KCard>
      </div>
    </main>
  );
}
