import { listAthleteMemberships } from "@/server/actions/payments";
import PayMembershipButton from "@/components/atleta/PayMembershipButton";
import { AnimatedItem } from "@/components/kronos/AnimatedSection";

type StatusVisual = {
  label: string;
  variant: "active" | "pending" | "muted";
};

const STATUS_LABEL: Record<string, StatusVisual> = {
  PENDING: { label: "Pendiente de pago", variant: "pending" },
  ACTIVE: { label: "Activa", variant: "active" },
  PAUSED: { label: "Pausada", variant: "muted" },
  EXPIRED: { label: "Vencida", variant: "muted" },
  CANCELLED: { label: "Cancelada", variant: "muted" },
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  FAILED: "Rechazado",
  REFUNDED: "Reembolsado",
};

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusChipStyle(
  variant: StatusVisual["variant"],
): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: 999,
    fontFamily: "var(--k-font-display)",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
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
  let memberships: Awaited<ReturnType<typeof listAthleteMemberships>> = [];
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
      {memberships.map((m, idx) => {
        const statusInfo = STATUS_LABEL[m.status] ?? STATUS_LABEL.PENDING;
        return (
          <AnimatedItem key={m.id}>
            <div
              {...(idx === 0 ? { "data-tour": "pagos.membresia-card" } : {})}
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
                    {m.planType} · {fmtDate(m.startDate)}
                    {m.endDate ? ` → ${fmtDate(m.endDate)}` : ""}
                  </div>
                </div>
                <span style={statusChipStyle(statusInfo.variant)}>
                  {statusInfo.label}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--k-t3)",
                  }}
                >
                  Monto
                </div>
                <div
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--k-t1)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {m.planPrice.toLocaleString("es-MX")} {m.planCurrency}
                </div>
              </div>

              {m.status === "PENDING" && m.pendingPaymentId && (
                <div data-tour="pagos.cta-pagar">
                  <PayMembershipButton
                    paymentId={m.pendingPaymentId}
                    amount={m.planPrice}
                    currency={m.planCurrency}
                  />
                </div>
              )}

              {m.payments.length > 0 && (
                <details data-tour="pagos.historial" style={{ marginTop: 16 }}>
                  <summary
                    style={{
                      cursor: "pointer",
                      fontFamily: "var(--k-font-display)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "var(--k-t2)",
                    }}
                  >
                    Historial ({m.payments.length})
                  </summary>
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {m.payments.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          borderRadius: 10,
                          background: "var(--k-elevated)",
                          border: "1px solid var(--k-line)",
                          fontSize: 12,
                          fontFamily: "var(--k-font-body)",
                        }}
                      >
                        <span style={{ color: "var(--k-t2)" }}>
                          {fmtDate(p.paidAt ?? p.createdAt)} · {p.gateway}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              color:
                                p.status === "PAID"
                                  ? "var(--k-accent)"
                                  : p.status === "FAILED"
                                    ? "#ff5e5e"
                                    : "var(--k-t2)",
                              fontWeight: p.status === "PAID" ? 700 : 500,
                              fontFamily: "var(--k-font-display)",
                              fontSize: 10,
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                            }}
                          >
                            {PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--k-font-display)",
                              fontWeight: 700,
                              color: "var(--k-t1)",
                            }}
                          >
                            {p.amount.toLocaleString("es-MX")} {p.currency}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </AnimatedItem>
        );
      })}
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
          style={{ height: 140, borderRadius: 16 }}
        />
      ))}
    </div>
  );
}
