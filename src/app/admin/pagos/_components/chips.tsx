export function GatewayChip({ gateway }: { gateway: string }) {
  if (gateway === "MERCADOPAGO") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] font-bold"
        style={{
          background: "var(--k-elevated)",
          color: "var(--k-t2)",
          border: "1px solid var(--k-line-2)",
        }}
        title="Mercado Pago"
      >
        <span aria-hidden>◆</span> MP
      </span>
    );
  }
  if (gateway === "CASH") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] font-bold"
        style={{
          background: "var(--k-accent-soft)",
          color: "var(--k-accent)",
          border: "1px solid var(--k-accent-line)",
        }}
        title="Efectivo"
      >
        <span aria-hidden>$</span> EFECTIVO
      </span>
    );
  }
  return <span className="k-chip k-chip-ghost text-[10px]">{gateway}</span>;
}

export function StatusChip({ status }: { status: string }) {
  const cls =
    status === "PAID"
      ? "k-chip-moss"
      : status === "PENDING"
        ? "k-chip-steel"
        : status === "FAILED" || status === "REFUNDED"
          ? "k-chip-ember"
          : "k-chip-ghost";
  return <span className={`k-chip ${cls} text-[10px]`}>{status}</span>;
}
