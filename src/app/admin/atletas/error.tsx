"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function AtletasError({
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
    <div
      style={{
        padding: "72px 20px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <p
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.04em",
          color: "var(--k-t2)",
          maxWidth: 280,
          lineHeight: 1.5,
        }}
      >
        No pudimos cargar la lista de atletas. Revisa tu conexión e inténtalo de
        nuevo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="k-btn-grad px-5 py-2.5 rounded-xl text-sm"
      >
        Reintentar
      </button>
    </div>
  );
}
