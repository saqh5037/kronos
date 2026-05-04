import { listAthleteMemberships } from "@/server/actions/payments";
import PayMembershipButton from "@/components/atleta/PayMembershipButton";

export const metadata = { title: "Kronos — Mis pagos" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendiente de pago", color: "var(--pr)" },
  ACTIVE: { label: "Activa", color: "var(--recovery)" },
  PAUSED: { label: "Pausada", color: "var(--text-2)" },
  EXPIRED: { label: "Vencida", color: "var(--text-3)" },
  CANCELLED: { label: "Cancelada", color: "var(--text-3)" },
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

export default async function AtletaPagosPage() {
  let memberships: Awaited<ReturnType<typeof listAthleteMemberships>> = [];
  try {
    memberships = await listAthleteMemberships();
  } catch {
    // sesión inválida o atleta sin perfil
  }

  return (
    <div className="pb-24">
      <div className="px-[18px] pt-14 pb-3">
        <p className="k-eyebrow">Mis pagos</p>
        <h1 className="font-display font-bold text-3xl">Membresías</h1>
      </div>

      {memberships.length === 0 ? (
        <div className="px-3.5">
          <div
            className="k-card p-6 text-center"
            style={{ borderColor: "var(--line)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              No tienes membresías asignadas. Pídele a tu coach que te asigne un
              plan.
            </p>
          </div>
        </div>
      ) : (
        <div className="px-3.5 space-y-3">
          {memberships.map((m) => {
            const statusInfo = STATUS_LABEL[m.status] ?? STATUS_LABEL.PENDING;
            return (
              <div key={m.id} className="k-card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold mb-1">
                      {m.planName}
                    </div>
                    <div
                      className="font-mono text-[10px] tracking-[0.06em]"
                      style={{ color: "var(--text-2)" }}
                    >
                      {m.planType} · {fmtDate(m.startDate)}
                      {m.endDate ? ` → ${fmtDate(m.endDate)}` : ""}
                    </div>
                  </div>
                  <span
                    className="k-chip"
                    style={{
                      color: statusInfo.color,
                      borderColor: statusInfo.color,
                      borderWidth: 1,
                      borderStyle: "solid",
                      padding: "3px 8px",
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    {statusInfo.label.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div
                    className="font-mono text-[11px]"
                    style={{ color: "var(--text-2)" }}
                  >
                    Monto
                  </div>
                  <div className="font-display text-lg font-bold">
                    {m.planPrice.toLocaleString()} {m.planCurrency}
                  </div>
                </div>

                {m.status === "PENDING" && m.pendingPaymentId && (
                  <PayMembershipButton
                    paymentId={m.pendingPaymentId}
                    amount={m.planPrice}
                    currency={m.planCurrency}
                  />
                )}

                {m.payments.length > 0 && (
                  <details className="mt-4">
                    <summary
                      className="cursor-pointer text-xs"
                      style={{ color: "var(--text-2)" }}
                    >
                      Historial ({m.payments.length})
                    </summary>
                    <div className="mt-2 space-y-1.5">
                      {m.payments.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-xs py-1.5 px-2 rounded"
                          style={{ background: "var(--bg-soft)" }}
                        >
                          <span style={{ color: "var(--text-2)" }}>
                            {fmtDate(p.paidAt ?? p.createdAt)} · {p.gateway}
                          </span>
                          <span className="flex items-center gap-2">
                            <span
                              style={{
                                color:
                                  p.status === "PAID"
                                    ? "var(--recovery)"
                                    : p.status === "FAILED"
                                      ? "var(--pr)"
                                      : "var(--text-2)",
                              }}
                            >
                              {PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                            </span>
                            <span className="font-mono">
                              {p.amount.toLocaleString()} {p.currency}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
