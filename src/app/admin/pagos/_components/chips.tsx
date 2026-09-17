import { Banknote, CreditCard, Landmark } from "lucide-react";
import { paymentGatewayLabel, paymentStatusLabel } from "@/lib/labels";
import type { PaymentGateway, PaymentStatus } from "@prisma/client";

const GATEWAY_ICON = {
  CASH: Banknote,
  MERCADOPAGO: Landmark,
  STRIPE: CreditCard,
} as const;

function isGateway(v: string): v is PaymentGateway {
  return v === "CASH" || v === "MERCADOPAGO" || v === "STRIPE";
}

function isStatus(v: string): v is PaymentStatus {
  return v === "PAID" || v === "PENDING" || v === "FAILED" || v === "REFUNDED";
}

/** Method chip: "Efectivo" / "Mercado Pago" / "Tarjeta" — never the raw gateway. */
export function GatewayChip({ gateway }: { gateway: string }) {
  if (!isGateway(gateway)) {
    return <span className="k-chip k-chip-ghost text-[10px]">Otro método</span>;
  }
  const Icon = GATEWAY_ICON[gateway];
  const cash = gateway === "CASH";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{
        background: cash ? "var(--k-accent-soft)" : "var(--k-elevated)",
        color: cash ? "var(--k-accent)" : "var(--k-t2)",
        border: `1px solid ${cash ? "var(--k-accent-line)" : "var(--k-line-2)"}`,
      }}
    >
      <Icon size={12} strokeWidth={2} aria-hidden />
      {paymentGatewayLabel[gateway]}
    </span>
  );
}

/** Status chip: "Pagado" / "Pendiente" / "Fallido" / "Reembolsado". */
export function StatusChip({ status }: { status: string }) {
  if (!isStatus(status)) {
    return <span className="k-chip k-chip-ghost text-[10px]">—</span>;
  }
  const cls =
    status === "PAID"
      ? "k-chip-moss"
      : status === "PENDING"
        ? "k-chip-steel"
        : status === "FAILED"
          ? "k-chip-ember"
          : "k-chip-ghost";
  return (
    <span className={`k-chip ${cls} text-[10px]`}>
      {paymentStatusLabel[status]}
    </span>
  );
}
