"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

export default function EventoSlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[atleta/eventos/[slug]] error:", error);
  }, [error]);

  return (
    <div className="pb-28 px-4 pt-14">
      <div className="k-card p-6 text-center space-y-4">
        <div className="k-eyebrow text-[var(--k-danger)]">ERROR · EVENTO</div>
        <h1 className="text-2xl font-display tracking-tight text-[var(--k-t1)]">
          No pudimos cargar tus eventos
        </h1>
        <p className="text-sm text-[var(--k-t2)]">
          Intenta de nuevo o regresa al listado de eventos.
        </p>
        <div className="flex gap-2 justify-center pt-2">
          <button onClick={reset} className="k-btn-grad">
            Reintentar
          </button>
          <Link href="/atleta/eventos" className="k-btn-ghost">
            Ver eventos
          </Link>
        </div>
      </div>
    </div>
  );
}
