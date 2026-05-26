type Props = {
  status: string;
};

const LABEL: Record<string, string> = {
  ACTIVE: "ACTIVO",
  TRIAL: "TRIAL",
  PAST_DUE: "VENCIDO",
  CANCELLED: "CANCELADO",
  EXPIRED: "EXPIRADO",
};

export function StatusBadge({ status }: Props) {
  const color =
    status === "ACTIVE"
      ? "var(--k-accent)"
      : status === "TRIAL"
        ? "var(--k-warning)"
        : "var(--k-danger)";

  const bg =
    status === "ACTIVE"
      ? "var(--k-accent-soft)"
      : status === "TRIAL"
        ? "rgba(255,176,32,0.1)"
        : "rgba(255,90,90,0.1)";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 10,
        fontFamily: "var(--k-font-display)",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color,
        background: bg,
        padding: "2px 8px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {LABEL[status] ?? status}
    </span>
  );
}
