"use client";

import type { AthleteStatus } from "@prisma/client";

const STATUS_STYLES: Record<
  AthleteStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  ACTIVE: {
    label: "Activo",
    bg: "rgba(200,255,45,0.10)",
    color: "var(--k-accent)",
    border: "rgba(200,255,45,0.35)",
  },
  PAUSED: {
    label: "Pausado",
    bg: "rgba(255,176,32,0.10)",
    color: "var(--k-warning)",
    border: "rgba(255,176,32,0.35)",
  },
  DROPIN: {
    label: "Drop-in",
    bg: "rgba(138,138,148,0.10)",
    color: "var(--k-t2)",
    border: "rgba(138,138,148,0.30)",
  },
  CANCELLED: {
    label: "Cancelado",
    bg: "rgba(255,90,90,0.10)",
    color: "var(--k-danger)",
    border: "rgba(255,90,90,0.30)",
  },
};

export function AthleteStatusBadge({ status }: { status: AthleteStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.CANCELLED;
  return (
    <span
      style={{
        fontFamily: "var(--k-font-display)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        padding: "2px 8px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}
