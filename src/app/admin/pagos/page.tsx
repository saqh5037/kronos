import { listPlans, type PlanRow } from "@/server/actions/plans";
import {
  listMemberships,
  type MembershipRow,
} from "@/server/actions/memberships";
import {
  listPayments,
  getPaymentStats,
  type PaymentRow,
  type PaymentStats,
} from "@/server/actions/payments";
import { listAthletes } from "@/server/actions/athletes";
import PlanForm from "@/components/PlanForm";
import MembershipAssignForm from "@/components/MembershipAssignForm";
import CashPaymentForm from "@/components/CashPaymentForm";
import { formatDayMonth } from "@/lib/week";

export const metadata = { title: "Kronos — Pagos" };

export default async function PagosPage() {
  let plans: PlanRow[] = [];
  let memberships: MembershipRow[] = [];
  let payments: PaymentRow[] = [];
  let stats: PaymentStats = {
    monthRevenue: 0,
    monthCount: 0,
    pendingRevenue: 0,
    pendingCount: 0,
  };
  let athletes: { id: string; firstName: string; lastName: string }[] = [];

  try {
    [plans, memberships, payments, stats, athletes] = await Promise.all([
      listPlans(),
      listMemberships({ status: "ACTIVE" }),
      listPayments({ limit: 30 }),
      getPaymentStats(),
      listAthletes(),
    ]);
  } catch {
    // BD/sesión ausente
  }

  const activePlans = plans.filter((p) => p.isActive);

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="k-eyebrow mb-1">Operación</p>
        <h1 className="font-display font-bold text-3xl tracking-tight">
          Pagos
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
          Planes, memberships activas y registro de cobros
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat
          label="Ingresos del mes"
          value={`$${stats.monthRevenue.toLocaleString("es-MX")}`}
          tone="recovery"
        />
        <Stat
          label="Pagos del mes"
          value={String(stats.monthCount)}
          tone="strain"
        />
        <Stat label="Memberships activas" value={String(memberships.length)} />
        <Stat
          label="Por cobrar"
          value={`$${stats.pendingRevenue.toLocaleString("es-MX")}`}
          tone={stats.pendingCount > 0 ? "pr" : undefined}
        />
      </div>

      {/* Planes */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
          <p className="k-eyebrow" style={{ color: "var(--text-2)" }}>
            Planes ({activePlans.length})
          </p>
          <PlanForm />
        </div>
        {activePlans.length === 0 ? (
          <div
            className="p-6 rounded-xl border text-center"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              No hay planes activos. Crea el primero para empezar a asignar
              memberships.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activePlans.map((p) => (
              <PlanCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      {/* Memberships */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
          <p className="k-eyebrow" style={{ color: "var(--text-2)" }}>
            Memberships activas ({memberships.length})
          </p>
          {activePlans.length > 0 && athletes.length > 0 && (
            <MembershipAssignForm
              athletes={athletes}
              plans={activePlans.map((p) => ({
                id: p.id,
                name: p.name,
                type: p.type,
                price: p.price,
              }))}
            />
          )}
        </div>
        {memberships.length === 0 ? (
          <div
            className="p-6 rounded-xl border text-center"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              Sin memberships activas. Asigna una con el botón de arriba.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--line)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--line)",
                    background: "var(--card)",
                  }}
                >
                  <th className="text-left px-4 py-3 k-eyebrow">Atleta</th>
                  <th className="text-left px-4 py-3 k-eyebrow">Plan</th>
                  <th className="text-left px-4 py-3 k-eyebrow">Vigencia</th>
                  <th className="text-left px-4 py-3 k-eyebrow">Clases</th>
                  <th className="text-left px-4 py-3 k-eyebrow">Pagado</th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((m) => (
                  <tr
                    key={m.id}
                    style={{ borderBottom: "1px solid var(--line)" }}
                  >
                    <td className="px-4 py-2.5 font-medium">{m.athleteName}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-sm">{m.planName}</span>
                      <span
                        className="ml-2 text-[10px] font-mono"
                        style={{ color: "var(--text-3)" }}
                      >
                        {m.planType}
                      </span>
                    </td>
                    <td
                      className="px-4 py-2.5 font-mono text-xs"
                      style={{ color: "var(--text-3)" }}
                    >
                      {formatDayMonth(m.startDate)}{" "}
                      {m.endDate ? `→ ${formatDayMonth(m.endDate)}` : "→ ∞"}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className="font-mono">{m.classesUsed}</span>
                      {m.classesRemaining !== null && (
                        <span style={{ color: "var(--text-3)" }}>
                          {" "}
                          / {m.classesUsed + m.classesRemaining}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono">
                      ${m.amountPaid.toLocaleString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payments */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
          <p className="k-eyebrow" style={{ color: "var(--text-2)" }}>
            Últimos pagos ({payments.length})
          </p>
          {memberships.length > 0 && (
            <CashPaymentForm
              memberships={memberships.map((m) => ({
                id: m.id,
                athleteName: m.athleteName,
                planName: m.planName,
                amountPaid: m.amountPaid,
              }))}
            />
          )}
        </div>
        {payments.length === 0 ? (
          <div
            className="p-6 rounded-xl border text-center"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              Sin pagos registrados.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--line)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--line)",
                    background: "var(--card)",
                  }}
                >
                  <th className="text-left px-4 py-3 k-eyebrow">Fecha</th>
                  <th className="text-left px-4 py-3 k-eyebrow">Atleta</th>
                  <th className="text-left px-4 py-3 k-eyebrow">Plan</th>
                  <th className="text-left px-4 py-3 k-eyebrow">Método</th>
                  <th className="text-left px-4 py-3 k-eyebrow">Estado</th>
                  <th className="text-right px-4 py-3 k-eyebrow">Monto</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    style={{ borderBottom: "1px solid var(--line)" }}
                  >
                    <td
                      className="px-4 py-2.5 font-mono text-xs"
                      style={{ color: "var(--text-3)" }}
                    >
                      {formatDayMonth(p.paidAt ?? p.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 font-medium">
                      {p.athleteName ?? "—"}
                    </td>
                    <td
                      className="px-4 py-2.5 text-xs"
                      style={{ color: "var(--text-2)" }}
                    >
                      {p.planName ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className="k-chip k-chip-ghost text-[10px]">
                        {p.gateway}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`k-chip ${chipForStatus(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-2.5 font-mono font-bold text-right"
                      style={{
                        color:
                          p.status === "PAID"
                            ? "var(--recovery)"
                            : p.status === "REFUNDED"
                              ? "var(--text-3)"
                              : "var(--text)",
                      }}
                    >
                      ${p.amount.toLocaleString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "recovery" | "strain" | "pr";
}) {
  const color =
    tone === "recovery"
      ? "var(--recovery)"
      : tone === "strain"
        ? "var(--strain)"
        : tone === "pr"
          ? "var(--pr)"
          : "var(--text)";
  return (
    <div
      className="p-3 rounded-xl border"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <p className="k-eyebrow" style={{ color: "var(--text-2)" }}>
        {label}
      </p>
      <p className="font-display font-bold text-2xl mt-1" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function PlanCard({ p }: { p: PlanRow }) {
  return (
    <div
      className="p-4 rounded-xl border flex flex-col"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-bold text-base">{p.name}</h3>
        <span className="k-chip k-chip-strain text-[10px]">{p.type}</span>
      </div>
      <p
        className="font-display font-bold text-3xl mt-3"
        style={{
          background: "var(--grad)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        ${p.price.toLocaleString("es-MX")}
        <span
          className="text-xs ml-1 font-mono font-normal"
          style={{ color: "var(--text-3)" }}
        >
          {p.currency}
        </span>
      </p>
      <div
        className="flex items-center gap-3 mt-2 text-xs"
        style={{ color: "var(--text-3)" }}
      >
        {p.classesPerMonth && <span>{p.classesPerMonth} clases/mes</span>}
        {p.durationDays && <span>{p.durationDays} días</span>}
      </div>
      <div
        className="mt-3 pt-3 border-t flex items-center justify-between text-xs"
        style={{ borderColor: "var(--line)", color: "var(--text-2)" }}
      >
        <span>
          {p.activeMembershipCount} membership
          {p.activeMembershipCount === 1 ? "" : "s"} activa
          {p.activeMembershipCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

function chipForStatus(status: string): string {
  switch (status) {
    case "PAID":
      return "k-chip-recovery";
    case "PENDING":
      return "k-chip-strain";
    case "FAILED":
    case "REFUNDED":
      return "k-chip-pr";
    default:
      return "k-chip-ghost";
  }
}
