/**
 * Athlete memberships and payment history.
 *
 * Audit 2026-09-15: "Plan types leak enums: 'UNLIMITED', 'MONTHLY'"; "no next
 * charge date or amount, no payment method"; "history collapsed behind an ASCII
 * '▸ HISTORIAL (4)'"; "'Mensual Ilimitado · 18 MAY 2026 → 5 OCT 2026' is 4.5
 * months for a 'mensual' plan".
 *
 * Every enum goes through `@/lib/labels`, money and dates through
 * `@/lib/format`, the period is described by the plan instead of guessed from
 * the word "mensual", and the history is expanded by default.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listAthleteMemberships } from "@/server/actions/payments";
import PayMembershipButton from "@/components/atleta/PayMembershipButton";
import { AnimatedItem } from "@/components/kronos/AnimatedSection";
import {
  membershipStatusLabel,
  paymentGatewayLabel,
  paymentStatusLabel,
  planTypeLabel,
} from "@/lib/labels";
import { formatDateLong, formatInt, formatMXN } from "@/lib/format";

type Membership = Awaited<ReturnType<typeof listAthleteMemberships>>[number];

type StatusVariant = "active" | "pending" | "muted";

const STATUS_VARIANT: Record<string, StatusVariant> = {
  PENDING: "pending",
  ACTIVE: "active",
  PAUSED: "muted",
  EXPIRED: "muted",
  CANCELLED: "muted",
};

function money(amount: number, currency: string): string {
  // The shared MXN formatter covers the only currency the product bills in;
  // anything else prints the raw code rather than a wrong symbol.
  if (currency.toUpperCase() === "MXN") return formatMXN(amount);
  return `${formatInt(amount)} ${currency}`;
}

function statusChipStyle(variant: StatusVariant): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: 999,
    fontFamily: "var(--k-font-display)",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };
  if (variant === "active") {
    return {
      ...base,
      color: "var(--k-accent)",
      background: "var(--k-accent-soft)",
      border: "1px solid var(--k-accent-line)",
    };
  }
  if (variant === "pending") {
    // A membership waiting for payment is a real pending state, so warning is
    // the honest token here.
    return {
      ...base,
      color: "var(--k-warning)",
      background: "rgba(255, 176, 32, 0.12)",
      border: "1px solid rgba(255, 176, 32, 0.32)",
    };
  }
  return {
    ...base,
    color: "var(--k-t3)",
    background: "var(--k-elevated)",
    border: "1px solid var(--k-line)",
  };
}

export async function PagosContent() {
  let memberships: Membership[] = [];
  try {
    memberships = await listAthleteMemberships();
  } catch {
    // sesión inválida o atleta sin perfil
  }

  if (memberships.length === 0) {
    return (
      <div style={{ padding: "0 16px" }}>
        <div
          style={{
            padding: "32px 24px",
            background: "var(--k-surface)",
            border: "1px dashed var(--k-line)",
            borderRadius: 16,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            alignItems: "center",
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "var(--k-t2)",
              fontFamily: "var(--k-font-body)",
              margin: 0,
            }}
          >
            No tienes membresías asignadas. Pídele a tu coach que te asigne un
            plan.
          </p>
          <Link
            href="/atleta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              borderRadius: 10,
              background: "var(--k-elevated)",
              border: "1px solid var(--k-line)",
              color: "var(--k-t2)",
              fontFamily: "var(--k-font-display)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textDecoration: "none",
              minHeight: 44,
            }}
          >
            Volver al inicio
            <ArrowRight size={13} aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "0 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {memberships.map((m, idx) => (
        <AnimatedItem key={m.id}>
          <MembershipCard membership={m} isFirst={idx === 0} />
        </AnimatedItem>
      ))}
    </div>
  );
}

function MembershipCard({
  membership: m,
  isFirst,
}: {
  membership: Membership;
  isFirst: boolean;
}) {
  const variant = STATUS_VARIANT[m.status] ?? "muted";
  const lastPaid = m.payments.find((p) => p.status === "PAID") ?? null;
  const method = lastPaid ? paymentGatewayLabel[lastPaid.gateway] : null;

  return (
    <div
      {...(isFirst ? { "data-tour": "pagos.membresia-card" } : {})}
      style={{
        padding: 16,
        background: "var(--k-surface)",
        border: "1px solid var(--k-line)",
        borderRadius: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 4,
              color: "var(--k-t1)",
              fontFamily: "var(--k-font-body)",
            }}
          >
            {m.planName}
          </div>
          {/* The plan type comes from the label map, and the period is stated
              as a range instead of implying a monthly cycle the dates do not
              support. */}
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--k-t2)",
            }}
          >
            Plan {planTypeLabel[m.planType]}
          </div>
          <div
            style={{
              fontFamily: "var(--k-font-body)",
              fontSize: 11,
              color: "var(--k-t3)",
              marginTop: 3,
            }}
          >
            {m.endDate
              ? `Vigencia: ${formatDateLong(new Date(m.startDate))} al ${formatDateLong(new Date(m.endDate))}`
              : `Desde ${formatDateLong(new Date(m.startDate))}`}
          </div>
        </div>
        <span style={statusChipStyle(variant)}>
          {membershipStatusLabel[m.status]}
        </span>
      </div>

      <DataRow
        label="Monto"
        value={money(m.planPrice, m.planCurrency)}
        strong
      />
      {m.endDate && (
        <DataRow
          label={m.autoRenew ? "Próximo cobro" : "Vence"}
          value={formatDateLong(new Date(m.endDate))}
        />
      )}
      {method && <DataRow label="Método" value={method} />}

      {m.status === "PENDING" && m.pendingPaymentId && (
        <div data-tour="pagos.cta-pagar" style={{ marginTop: 14 }}>
          <PayMembershipButton
            paymentId={m.pendingPaymentId}
            amount={m.planPrice}
            currency={m.planCurrency}
          />
        </div>
      )}

      {m.payments.length > 0 && (
        <div data-tour="pagos.historial" style={{ marginTop: 18 }}>
          {/* Expanded by default: the history is the trust moment, not an
              easter egg behind an ASCII triangle. */}
          <div
            className="k-mono"
            style={{
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--k-t3)",
              marginBottom: 8,
            }}
          >
            Historial ({m.payments.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {m.payments.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "var(--k-elevated)",
                  border: "1px solid var(--k-line)",
                  fontSize: 12,
                  fontFamily: "var(--k-font-body)",
                }}
              >
                <span style={{ color: "var(--k-t2)", minWidth: 0 }}>
                  {formatDateLong(new Date(p.paidAt ?? p.createdAt))} ·{" "}
                  {paymentGatewayLabel[p.gateway]}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      color:
                        p.status === "PAID"
                          ? "var(--k-accent)"
                          : p.status === "FAILED"
                            ? "var(--k-danger)"
                            : "var(--k-t2)",
                      fontWeight: p.status === "PAID" ? 700 : 500,
                      fontFamily: "var(--k-font-display)",
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    {paymentStatusLabel[p.status]}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontWeight: 700,
                      color: "var(--k-t1)",
                    }}
                  >
                    {money(p.amount, p.currency)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DataRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
        padding: "6px 0",
        borderTop: "1px solid var(--k-line)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--k-t3)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: strong ? 20 : 13,
          fontWeight: 700,
          color: strong ? "var(--k-t1)" : "var(--k-t2)",
          letterSpacing: strong ? "-0.02em" : "0",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function PagosContentSkeleton() {
  return (
    <div
      style={{
        padding: "0 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="k-card k-skeleton"
          style={{ height: 180, borderRadius: 16 }}
        />
      ))}
    </div>
  );
}
