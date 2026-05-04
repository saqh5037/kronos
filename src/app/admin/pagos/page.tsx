import { listPlans, type PlanRow } from "@/server/actions/plans";
import {
  listMembershipsPaged,
  type MembershipRow,
} from "@/server/actions/memberships";
import {
  listPaymentsPaged,
  getPaymentStats,
  getRevenueByDay,
  listOverdueMemberships,
  type PaymentRow,
  type PaymentStats,
  type RevenueByDayPoint,
  type OverdueMembership,
} from "@/server/actions/payments";
import { listAthletes } from "@/server/actions/athletes";
import PlanForm from "@/components/PlanForm";
import MembershipAssignForm from "@/components/MembershipAssignForm";
import CashPaymentForm from "@/components/CashPaymentForm";
import { rangeFromParams, previousRange, formatRange } from "@/lib/dates";
import type { PaymentGateway, PaymentStatus } from "@/lib/validations/payment";
import type { MembershipStatus } from "@/lib/validations/membership";
import { MetricDelta } from "@/components/charts/MetricDelta";
import { PagosFilters } from "./_components/PagosFilters";
import { RevenueChart } from "./_components/RevenueChart";
import { PlanDonut } from "./_components/PlanDonut";
import { PaymentsTable } from "./_components/PaymentsTable";
import { MembershipsTable } from "./_components/MembershipsTable";

export const metadata = { title: "Kronos — Pagos" };

type SearchParams = {
  preset?: string;
  from?: string;
  to?: string;
  q?: string;
  gateway?: string;
  status?: string;
  plan?: string;
  ppay?: string;
  pmem?: string;
};

const PAGE_SIZE = 25;

function parseGateway(v?: string): PaymentGateway | undefined {
  return v === "CASH" || v === "MERCADOPAGO" ? v : undefined;
}

function parsePaymentStatus(v?: string): PaymentStatus | undefined {
  return v === "PAID" || v === "PENDING" || v === "FAILED" || v === "REFUNDED"
    ? v
    : undefined;
}

function parsePage(v?: string): number {
  const n = parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

const fmtMoney = (v: number) => `$${v.toLocaleString("es-MX")}`;

export default async function PagosPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const range = rangeFromParams({
    preset: sp.preset,
    from: sp.from,
    to: sp.to,
  });
  const prev = previousRange(range);
  const search = (sp.q ?? "").trim() || undefined;
  const gateway = parseGateway(sp.gateway);
  const paymentStatus = parsePaymentStatus(sp.status);
  const planId = sp.plan?.trim() || undefined;
  const ppay = parsePage(sp.ppay);
  const pmem = parsePage(sp.pmem);

  let plans: PlanRow[] = [];
  let payments = {
    rows: [] as PaymentRow[],
    total: 0,
    page: ppay,
    pageSize: PAGE_SIZE,
  };
  let memberships = {
    rows: [] as MembershipRow[],
    total: 0,
    page: pmem,
    pageSize: PAGE_SIZE,
  };
  let revenue: RevenueByDayPoint[] = [];
  let revenuePrev: RevenueByDayPoint[] = [];
  let overdue: OverdueMembership[] = [];
  let stats: PaymentStats = {
    monthRevenue: 0,
    monthCount: 0,
    pendingRevenue: 0,
    pendingCount: 0,
  };
  let athletes: { id: string; firstName: string; lastName: string }[] = [];

  try {
    [
      plans,
      payments,
      memberships,
      revenue,
      revenuePrev,
      overdue,
      stats,
      athletes,
    ] = await Promise.all([
      listPlans(),
      listPaymentsPaged({
        dateFrom: range.from,
        dateTo: range.to,
        search,
        gateway,
        status: paymentStatus,
        page: ppay,
        pageSize: PAGE_SIZE,
      }),
      listMembershipsPaged({
        search,
        status: "ACTIVE" as MembershipStatus,
        planId,
        page: pmem,
        pageSize: PAGE_SIZE,
      }),
      getRevenueByDay({ dateFrom: range.from, dateTo: range.to }),
      getRevenueByDay({ dateFrom: prev.from, dateTo: prev.to }),
      listOverdueMemberships({ limit: 20 }),
      getPaymentStats(),
      listAthletes(),
    ]);
  } catch {
    // BD/sesión ausente — render placeholder
  }

  const activePlans = plans.filter((p) => p.isActive);

  const rangeRevenue = revenue.reduce((s, p) => s + p.revenue, 0);
  const rangeRevenuePrev = revenuePrev.reduce((s, p) => s + p.revenue, 0);
  const rangeCount = revenue.reduce((s, p) => s + p.count, 0);
  const rangeCountPrev = revenuePrev.reduce((s, p) => s + p.count, 0);

  const planDist = plans
    .map((p) => ({ name: p.name, value: p.activeMembershipCount }))
    .filter((p) => p.value > 0);

  const overdueAmount = overdue.reduce((s, m) => s + m.pendingAmount, 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="k-eyebrow mb-1">Operación</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Pagos
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
          {formatRange(range)} · revenue, memberships, morosos y cobros
        </p>
      </div>

      <PagosFilters
        plans={activePlans.map((p) => ({ id: p.id, name: p.name }))}
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Ingresos rango"
          value={fmtMoney(rangeRevenue)}
          tone="recovery"
          delta={
            <MetricDelta
              current={rangeRevenue}
              previous={rangeRevenuePrev}
              goodWhen="higher"
            />
          }
        />
        <KpiCard
          label="Pagos rango"
          value={String(rangeCount)}
          tone="strain"
          delta={
            <MetricDelta
              current={rangeCount}
              previous={rangeCountPrev}
              goodWhen="higher"
              formatter={(v) => v.toFixed(0)}
            />
          }
        />
        <KpiCard
          label="Por cobrar"
          value={fmtMoney(stats.pendingRevenue)}
          tone={stats.pendingCount > 0 ? "pr" : undefined}
        />
        <KpiCard
          label="Morosos"
          value={overdue.length === 0 ? "0" : `${overdue.length}`}
          tone={overdue.length > 0 ? "pr" : undefined}
          subtitle={
            overdue.length > 0
              ? `${fmtMoney(overdueAmount)} adeudados`
              : "Al día"
          }
        />
      </div>

      {/* Charts row */}
      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="k-card p-4 lg:col-span-2">
          <p className="k-eyebrow mb-2">
            Ingresos diarios · {formatRange(range)}
          </p>
          {revenue.length > 0 && rangeRevenue > 0 ? (
            <RevenueChart data={revenue} />
          ) : (
            <p className="py-10 text-center text-sm text-[var(--text-3)]">
              Sin pagos en el rango
            </p>
          )}
        </div>
        <div className="k-card p-4">
          <p className="k-eyebrow mb-2">Distribución de planes</p>
          {planDist.length > 0 ? (
            <PlanDonut data={planDist} />
          ) : (
            <p className="py-10 text-center text-sm text-[var(--text-3)]">
              Sin memberships activas
            </p>
          )}
        </div>
      </div>

      {/* Morosos */}
      {overdue.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="k-eyebrow" style={{ color: "var(--pr)" }}>
              🚨 Morosos ({overdue.length})
            </p>
          </div>
          <div className="k-card overflow-hidden">
            <table className="k-table text-sm">
              <thead>
                <tr>
                  <th>Atleta</th>
                  <th>Plan</th>
                  <th>Vencida</th>
                  <th>Días</th>
                  <th className="text-right">Adeudo</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((m) => (
                  <tr key={m.membershipId}>
                    <td className="font-medium">{m.athleteName}</td>
                    <td className="text-[var(--text-2)]">{m.planName}</td>
                    <td className="font-mono text-xs text-[var(--text-3)]">
                      {m.endDate.toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td>
                      <span className="k-chip k-chip-pr text-[10px]">
                        {m.daysOverdue}d
                      </span>
                    </td>
                    <td
                      className="text-right font-mono font-bold"
                      style={{ color: "var(--pr)" }}
                    >
                      {fmtMoney(m.pendingAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Memberships */}
      <section className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="k-eyebrow">Memberships</p>
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
        <MembershipsTable
          rows={memberships.rows}
          total={memberships.total}
          page={memberships.page}
          pageSize={memberships.pageSize}
          filterValues={{ search, status: "ACTIVE", planId }}
        />
      </section>

      {/* Payments */}
      <section className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="k-eyebrow">Pagos</p>
          {memberships.rows.length > 0 && (
            <CashPaymentForm
              memberships={memberships.rows.map((m) => ({
                id: m.id,
                athleteName: m.athleteName,
                planName: m.planName,
                amountPaid: m.amountPaid,
              }))}
            />
          )}
        </div>
        <PaymentsTable
          rows={payments.rows}
          total={payments.total}
          page={payments.page}
          pageSize={payments.pageSize}
          filterValues={{
            dateFrom: range.from,
            dateTo: range.to,
            search,
            gateway,
            status: paymentStatus,
          }}
        />
      </section>

      {/* Planes */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="k-eyebrow">Planes ({activePlans.length})</p>
          <PlanForm />
        </div>
        {activePlans.length === 0 ? (
          <div className="k-card p-6 text-center">
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              No hay planes activos. Crea el primero para empezar a asignar
              memberships.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {activePlans.map((p) => (
              <PlanCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtitle,
  tone,
  delta,
}: {
  label: string;
  value: string;
  subtitle?: string;
  tone?: "recovery" | "strain" | "pr";
  delta?: React.ReactNode;
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
    <div className="k-card p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="k-eyebrow" style={{ color: "var(--text-2)" }}>
          {label}
        </p>
        {delta}
      </div>
      <p className="font-display mt-1 text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      {subtitle ? (
        <p className="mt-1 text-xs text-[var(--text-3)]">{subtitle}</p>
      ) : null}
    </div>
  );
}

function PlanCard({ p }: { p: PlanRow }) {
  return (
    <div className="k-card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-base font-bold">{p.name}</h3>
        <span className="k-chip k-chip-strain text-[10px]">{p.type}</span>
      </div>
      <p
        className="font-display mt-3 text-3xl font-bold"
        style={{
          background: "var(--grad)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        ${p.price.toLocaleString("es-MX")}
        <span
          className="ml-1 font-mono text-xs font-normal"
          style={{ color: "var(--text-3)" }}
        >
          {p.currency}
        </span>
      </p>
      <div
        className="mt-2 flex items-center gap-3 text-xs"
        style={{ color: "var(--text-3)" }}
      >
        {p.classesPerMonth && <span>{p.classesPerMonth} clases/mes</span>}
        {p.durationDays && <span>{p.durationDays} días</span>}
      </div>
      <div
        className="mt-3 flex items-center justify-between border-t pt-3 text-xs"
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
