"use client";

/**
 * Route-level error backstop for /atleta.
 *
 * Optional sections (greeting, survey, leaderboard) degrade silently on their
 * own. This boundary only catches a catastrophic failure of a core section
 * (e.g. the hero's data) so the app shows a recoverable state instead of a
 * blank screen or Next's default error page.
 */
export default function AtletaError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        No pudimos cargar tu inicio. Revisa tu conexión e inténtalo de nuevo.
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
