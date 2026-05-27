"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

export default function SaludError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[atleta/salud] error:", error);
  }, [error]);

  return (
    <div className="pb-28 px-4 pt-14">
      <div className="k-card p-6 text-center space-y-4">
        <div className="k-eyebrow text-[var(--k-danger)]">ERROR · SALUD</div>
        <h1 className="text-2xl font-display tracking-tight text-[var(--k-t1)]">
          No pudimos cargar tu progreso
        </h1>
        <p className="text-sm text-[var(--k-t2)]">
          Intenta de nuevo en un momento. Tu historial está a salvo.
        </p>
        <div className="flex gap-2 justify-center pt-2">
          <button onClick={reset} className="k-btn-grad">
            Reintentar
          </button>
          <Link href="/atleta" className="k-btn-ghost">
            Volver a inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
