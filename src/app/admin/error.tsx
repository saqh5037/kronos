"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  console.error("[admin error boundary]", error.digest ?? error.message);
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--k-bg)" }}
    >
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            color: "var(--k-warning)",
            fontSize: 28,
          }}
        >
          ⚠️
        </div>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 24,
            fontWeight: 700,
            color: "var(--k-t1)",
            marginBottom: 12,
          }}
        >
          Error en el admin
        </h1>
        <p
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 14,
            color: "var(--k-t2)",
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          Hubo un error inesperado en el panel de administración.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              height: 44,
              padding: "0 20px",
              borderRadius: 10,
              background: "var(--k-accent)",
              border: 0,
              color: "var(--k-accent-on)",
              fontFamily: "var(--k-font-body)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
          <Link
            href="/admin"
            style={{
              height: 44,
              padding: "0 20px",
              borderRadius: 10,
              background: "transparent",
              border: "1px solid var(--k-line)",
              color: "var(--k-t1)",
              fontFamily: "var(--k-font-body)",
              fontSize: 13,
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            Ir al dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
