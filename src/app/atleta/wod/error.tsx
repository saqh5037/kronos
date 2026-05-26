"use client";

export default function WodError({
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
        No pudimos cargar el WOD de hoy. Revisa tu conexión e inténtalo de
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
