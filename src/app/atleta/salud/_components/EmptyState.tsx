"use client";

type Props = {
  onLog: () => void;
};

export function EmptyState({ onLog }: Props) {
  return (
    <div
      style={{
        margin: "20px 16px",
        padding: "40px 22px",
        background: "var(--k-elevated)",
        border: "1px solid var(--k-line)",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        textAlign: "center",
      }}
    >
      <div
        aria-hidden
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "var(--k-accent-soft)",
          border: "1px solid var(--k-accent-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--k-accent)",
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12h4l2-6 4 12 2-6h6" />
        </svg>
      </div>

      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 18,
          fontWeight: 700,
          color: "var(--k-t1)",
          letterSpacing: "-0.01em",
        }}
      >
        Tu salud, paso a paso
      </div>

      <div
        style={{
          fontFamily: "var(--k-font-body)",
          fontSize: 13,
          color: "var(--k-t2)",
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        Registra tu peso, perímetros y composición para ver cómo evolucionás en
        el tiempo. Sin obsesión con números: progreso real.
      </div>

      <button
        type="button"
        onClick={onLog}
        className="k-tap"
        style={{
          marginTop: 8,
          padding: "12px 22px",
          background: "var(--k-accent)",
          color: "var(--k-accent-on)",
          border: "none",
          borderRadius: 12,
          fontFamily: "var(--k-font-display)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          cursor: "pointer",
          boxShadow: "var(--k-accent-glow)",
        }}
      >
        + Registrar mi primer peso
      </button>
    </div>
  );
}
