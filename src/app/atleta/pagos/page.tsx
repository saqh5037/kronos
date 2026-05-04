import { listAthleteMemberships } from "@/server/actions/payments";
import PayMembershipButton from "@/components/atleta/PayMembershipButton";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import KCard from "@/components/kronos/KCard";

export const metadata = { title: "Kronos — Mis pagos" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  PENDING: {
    label: "Pendiente de pago",
    color: "var(--pr)",
    bg: "var(--pr-soft)",
    border: "var(--pr-line)",
  },
  ACTIVE: {
    label: "Activa",
    color: "var(--recovery)",
    bg: "var(--recovery-soft)",
    border: "var(--recovery-line)",
  },
  PAUSED: {
    label: "Pausada",
    color: "var(--text-2)",
    bg: "var(--btn-ghost-bg)",
    border: "var(--line)",
  },
  EXPIRED: {
    label: "Vencida",
    color: "var(--text-3)",
    bg: "var(--btn-ghost-bg)",
    border: "var(--line)",
  },
  CANCELLED: {
    label: "Cancelada",
    color: "var(--text-3)",
    bg: "var(--btn-ghost-bg)",
    border: "var(--line)",
  },
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
    <div className="pb-28">
      <AnimatedSection className="px-[18px] pt-14 pb-3">
        <AnimatedItem>
          <p className="k-eyebrow">Mis pagos</p>
          <h1 className="font-display font-bold text-3xl">Membresías</h1>
        </AnimatedItem>
      </AnimatedSection>

      {memberships.length === 0 ? (
        <div className="px-3.5">
          <KCard>
            <p
              className="text-sm text-center py-6"
              style={{ color: "var(--text-2)" }}
            >
              No tienes membresías asignadas. Pídele a tu coach que te asigne un
              plan.
            </p>
          </KCard>
        </div>
      ) : (
        <div className="px-3.5 flex flex-col gap-3">
          {memberships.map((m) => {
            const statusInfo = STATUS_LABEL[m.status] ?? STATUS_LABEL.PENDING;
            return (
              <AnimatedItem key={m.id}>
                <KCard>
                  <div className="p-4">
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
                          background: statusInfo.bg,
                          border: `1px solid ${statusInfo.border}`,
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
                          className="cursor-pointer text-xs font-medium"
                          style={{ color: "var(--text-2)" }}
                        >
                          Historial ({m.payments.length})
                        </summary>
                        <div className="mt-2 space-y-1.5">
                          {m.payments.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg k-row"
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
                                    fontWeight: p.status === "PAID" ? 700 : 400,
                                  }}
                                >
                                  {PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                                </span>
                                <span className="font-mono font-bold">
                                  {p.amount.toLocaleString()} {p.currency}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </KCard>
              </AnimatedItem>
            );
          })}
        </div>
      )}
    </div>
  );
}
