"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          background: "var(--k-bg, #08080a)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "var(--k-surface, #0f1014)",
              border: "1px solid var(--k-line, #1c1c24)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              color: "var(--k-warning, #ffb020)",
              fontSize: 28,
            }}
          >
            ⚠️
          </div>
          <h1
            style={{
              fontFamily: "var(--k-font-display, 'IBM Plex Mono', monospace)",
              fontSize: 24,
              fontWeight: 700,
              color: "var(--k-t1, #f5f5f7)",
              marginBottom: 12,
              marginTop: 0,
            }}
          >
            Algo salió mal
          </h1>
          <p
            style={{
              fontFamily: "var(--k-font-body, Inter, sans-serif)",
              fontSize: 14,
              color: "var(--k-t2, #8a8a94)",
              lineHeight: 1.6,
              marginBottom: 24,
              marginTop: 0,
            }}
          >
            Ocurrió un error inesperado. Intenta de nuevo o vuelve al inicio.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                height: 44,
                padding: "0 20px",
                borderRadius: 10,
                background: "var(--k-accent, #c8ff2d)",
                border: 0,
                color: "var(--k-accent-on, #08080a)",
                fontFamily: "var(--k-font-body, Inter, sans-serif)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error renders fuera del contexto del App Router; un <a> con recarga completa es la recuperación segura tras un crash del root layout (un <Link> asume router montado). */}
            <a
              href="/"
              style={{
                height: 44,
                padding: "0 20px",
                borderRadius: 10,
                background: "transparent",
                border: "1px solid var(--k-line, #1c1c24)",
                color: "var(--k-t1, #f5f5f7)",
                fontFamily: "var(--k-font-body, Inter, sans-serif)",
                fontSize: 13,
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              Ir al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
