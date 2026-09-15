import Link from "next/link";
import type { Route } from "next";
import { AlertTriangle } from "lucide-react";
import { listPlans, type PlanRow } from "@/server/actions/plans";
import {
  listMembershipsPaged,
  type MembershipRow,
} from "@/server/actions/memberships";
import {
  listPaymentsPaged,
  listOverdueMemberships,
  type PaymentRow,
  type OverdueMembership,
} from "@/server/actions/payments";
import { listAthletes } from "@/server/actions/athletes";
import PlanForm from "@/components/PlanForm";
import MembershipAssignForm from "@/components/MembershipAssignForm";
import CashPaymentForm from "@/components/CashPaymentForm";
import {
  dayKey,
  eachDayInRange,
  formatRange,
  previousRange,
  rangeFromParams,
  type DateRange,
} from "@/lib/dates";
import { formatMXN } from "@/lib/format";
import { planTypeLabel } from "@/lib/labels";
import type { PaymentGateway, PaymentStatus } from "@/lib/validations/payment";
import type { MembershipStatus } from "@/lib/validations/membership";
import { MetricDelta } from "@/components/charts/MetricDelta";
import {
  dailyRevenueSeries,
  dedupeOverdueMemberships,
  planCardLines,
  summarizePaymentPeriod,
} from "./_lib/period";
import { PagosFilters } from "./_components/PagosFilters";
import { RevenueChart } from "./_components/RevenueChart";
import { PlanDonut } from "./_components/PlanDonut";
import { PaymentsTable } from "./_components/PaymentsTable";
import { MembershipsTable } from "./_components/MembershipsTable";
import { OverdueTable } from "./_components/OverdueTable";

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
/** `MAX_PAGE_SIZE` in src/server/actions/types.ts. */
const FETCH_CHUNK = 200;
const MAX_CHUNKS = 10;

/** Anchor of the cash register in the header — every "register a payment" lands here. */
const CASH_ANCHOR = "#registrar-cobro";

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

/**
 * Every movement of the period, from ONE action, so the KPI breakdown and the
 * table count cannot disagree (audit 2026-09-15, P0 #6). The right home for
 * this is a server-side period summary — see the branch report.
 */
async function loadPeriodPayments(args: {
  range: DateRange;
  search?: string;
}): Promise<{ rows: PaymentRow[]; total: number }> {
  const first = await listPaymentsPaged({
    dateFrom: args.range.from,
    dateTo: args.range.to,
    search: args.search,
    page: 1,
    pageSize: FETCH_CHUNK,
  });
  const rows = [...first.rows];
  const pages = Math.min(MAX_CHUNKS, Math.ceil(first.total / FETCH_CHUNK));
  for (let page = 2; page <= pages; page++) {
    const next = await listPaymentsPaged({
      dateFrom: args.range.from,
      dateTo: args.range.to,
      search: args.search,
      page,
      pageSize: FETCH_CHUNK,
    });
    rows.push(...next.rows);
  }
  return { rows, total: first.total };
}

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
  const periodLabel = formatRange(range);
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
  let period = { rows: [] as PaymentRow[], total: 0 };
  let periodPrev = { rows: [] as PaymentRow[], total: 0 };
  let overdue: OverdueMembership[] = [];
  let athletes: { id: string; firstName: string; lastName: string }[] = [];

  try {
    [plans, payments, memberships, period, periodPrev, overdue, athletes] =
      await Promise.all([
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
        loadPeriodPayments({ range, search }),
        loadPeriodPayments({ range: prev, search }),
        listOverdueMemberships({ limit: 50 }),
        listAthletes(),
      ]);
  } catch {
    // BD/sesión ausente — render placeholder
  }

  const activePlans = plans.filter((p) => p.isActive);

  // Every number below comes from `period.rows` — one dataset, one period.
  const summary = summarizePaymentPeriod(period.rows);
  const summaryPrev = summarizePaymentPeriod(periodPrev.rows);
  const revenue = dailyRevenueSeries(
    period.rows,
    eachDayInRange(range).map(dayKey),
  );

  const overdueRows = dedupeOverdueMemberships(overdue);
  const overdueAmount = overdueRows.reduce((s, m) => s + m.pendingAmount, 0);

  const planDist = plans
    .map((p) => ({ name: p.name, value: p.activeMembershipCount }))
    .filter((p) => p.value > 0);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="k-eyebrow-bar">Operación · Ingresos</span>
          <h1
            className="k-h-italic font-display mt-2 text-[34px] leading-[1] font-extrabold tracking-[-0.02em] md:text-[42px]"
            style={{ color: "var(--k-t1)" }}
          >
            Pa<em>gos</em>
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
            {periodLabel} · quién debe, qué entró y qué falló
          </p>
        </div>
        {/*
          The cash register is the owner's most frequent action, so it lives in
          the first viewport as the primary control. `CashPaymentForm` styles its
          own collapsed trigger as a ghost button; promoting it from here keeps
          the change inside this route — the component should take a `variant`
          prop instead (see the branch report).
        */}
        <div
          id="registrar-cobro"
          className="scroll-mt-24 [&>button]:!rounded-full [&>button]:!border-none [&>button]:!bg-[var(--k-accent)] [&>button]:!px-5 [&>button]:!py-3 [&>button]:!text-sm [&>button]:!font-bold [&>button]:!text-[var(--k-accent-on)] [&>button]:!uppercase"
        >
          {memberships.rows.length > 0 ? (
            <CashPaymentForm
              memberships={memberships.rows.map((m) => ({
                id: m.id,
                athleteName: m.athleteName,
                planName: m.planName,
                amountPaid: m.amountPaid,
              }))}
            />
          ) : null}
        </div>
      </div>

      <PagosFilters
        plans={activePlans.map((p) => ({ id: p.id, name: p.name }))}
      />

      {/* KPIs — every number carries the period it belongs to */}
      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard
          label="Ingresos cobrados"
          value={formatMXN(summary.paid.amount)}
          period={periodLabel}
          tone="accent"
          delta={
            <MetricDelta
              current={summary.paid.amount}
              previous={summaryPrev.paid.amount}
              goodWhen="higher"
              formatter={(v) => formatMXN(v)}
            />
          }
        />
        <KpiCard
          label="Movimientos"
          value={String(summary.total)}
          period={periodLabel}
          subtitle={`${summary.paid.count} cobrados`}
          delta={
            <MetricDelta
              current={summary.total}
              previous={summaryPrev.total}
              goodWhen="higher"
              formatter={(v) => v.toFixed(0)}
            />
          }
        />
        <KpiCard
          label="Por cobrar"
          value={formatMXN(summary.pending.amount)}
          period={periodLabel}
          subtitle={`${summary.pending.count} pendiente${
            summary.pending.count === 1 ? "" : "s"
          }`}
          tone={summary.pending.count > 0 ? "warning" : undefined}
          href="/admin/pagos?status=PENDING#pagos"
        />
        <KpiCard
          label="Fallidos"
          value={String(summary.failed.count)}
          period={periodLabel}
          subtitle={
            summary.failed.count > 0
              ? `${formatMXN(summary.failed.amount)} sin cobrar`
              : "Ningún cobro rebotó"
          }
          tone={summary.failed.count > 0 ? "danger" : undefined}
          href="/admin/pagos?status=FAILED#pagos"
        />
        <KpiCard
          label="Morosos"
          value={String(overdueRows.length)}
          period="al día de hoy"
          subtitle={
            overdueRows.length > 0
              ? `${formatMXN(overdueAmount)} adeudados`
              : "Nadie con adeudo"
          }
          tone={overdueRows.length > 0 ? "warning" : undefined}
          href="/admin/pagos#morosos"
        />
      </div>

      <p className="mb-6 max-w-3xl text-xs" style={{ color: "var(--k-t3)" }}>
        <strong style={{ color: "var(--k-t2)" }}>Por cobrar</strong> son pagos
        ya registrados que siguen pendientes dentro del periodo.{" "}
        <strong style={{ color: "var(--k-t2)" }}>Morosos</strong> son membresías
        vencidas sin pago, sin importar el periodo: son personas, no
        movimientos.
      </p>

      {/* Charts row */}
      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="k-card p-4 lg:col-span-2">
          <p className="k-eyebrow mb-2">Ingresos cobrados · {periodLabel}</p>
          {summary.paid.amount > 0 ? (
            <RevenueChart data={revenue} />
          ) : (
            <p className="py-10 text-center text-sm text-[var(--k-t3)]">
              Sin cobros en el periodo
            </p>
          )}
        </div>
        <div className="k-card p-4">
          <p className="k-eyebrow mb-2">Mezcla de planes · hoy</p>
          {planDist.length > 0 ? (
            <PlanDonut data={planDist} />
          ) : (
            <p className="py-10 text-center text-sm text-[var(--k-t3)]">
              Sin membresías activas
            </p>
          )}
        </div>
      </div>

      {/* Morosos */}
      {overdueRows.length > 0 && (
        <section id="morosos" className="mb-6 scroll-mt-24">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p
              className="k-eyebrow inline-flex items-center gap-1.5"
              style={{ color: "var(--k-warning)" }}
            >
              <AlertTriangle size={13} strokeWidth={2.4} aria-hidden />
              Morosos ({overdueRows.length})
            </p>
            <p className="text-xs" style={{ color: "var(--k-t3)" }}>
              {formatMXN(overdueAmount)} adeudados al día de hoy
            </p>
          </div>
          <OverdueTable rows={overdueRows} cashHref={CASH_ANCHOR} />
        </section>
      )}

      {/* Payments */}
      <section id="pagos" className="mb-6 scroll-mt-24">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="k-eyebrow">Movimientos del periodo</p>
        </div>
        <PaymentsTable
          rows={payments.rows}
          total={payments.total}
          page={payments.page}
          pageSize={payments.pageSize}
          periodLabel={periodLabel}
          periodTotal={summary.total}
          cashHref={CASH_ANCHOR}
          filterValues={{
            dateFrom: range.from,
            dateTo: range.to,
            search,
            gateway,
            status: paymentStatus,
          }}
        />
      </section>

      {/* Membresías */}
      <section className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="k-eyebrow">Membresías</p>
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

      {/* Planes */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="k-eyebrow">Planes ({activePlans.length})</p>
          <PlanForm />
        </div>
        {activePlans.length === 0 ? (
          <div className="k-card p-6 text-center">
            <p className="text-sm" style={{ color: "var(--k-t2)" }}>
              No hay planes activos. Crea el primero para empezar a asignar
              membresías.
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

type KpiTone = "accent" | "warning" | "danger";

function KpiCard({
  label,
  value,
  period,
  subtitle,
  tone,
  delta,
  href,
}: {
  label: string;
  value: string;
  /** Repeated under every number so no KPI is period-less. */
  period: string;
  subtitle?: string;
  tone?: KpiTone;
  delta?: React.ReactNode;
  href?: string;
}) {
  const color =
    tone === "accent"
      ? "var(--k-accent)"
      : tone === "warning"
        ? "var(--k-warning)"
        : tone === "danger"
          ? "var(--k-danger)"
          : "var(--k-t1)";

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
          {label}
        </p>
        {delta}
      </div>
      <p className="font-display mt-1 text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="mt-1 text-[11px]" style={{ color: "var(--k-t3)" }}>
        {period}
        {subtitle ? ` · ${subtitle}` : ""}
      </p>
    </>
  );

  if (!href) return <div className="k-card p-3">{body}</div>;

  return (
    <Link
      href={href as Route}
      className="k-card block p-3 transition-colors hover:border-[var(--k-line-2)]"
    >
      {body}
    </Link>
  );
}

function PlanCard({ p }: { p: PlanRow }) {
  const lines = planCardLines(p);
  return (
    <div className="k-card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-base font-bold">{p.name}</h3>
        <span className="k-chip k-chip-ghost text-[10px]">
          {planTypeLabel[p.type]}
        </span>
      </div>
      <p
        className="font-display mt-3 text-3xl font-bold"
        style={{ color: "var(--k-accent)" }}
      >
        {formatMXN(p.price)}
      </p>
      <div
        className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
        style={{ color: "var(--k-t3)" }}
      >
        {lines.slice(0, -1).map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
      <div
        className="mt-3 border-t pt-3 text-xs"
        style={{ borderColor: "var(--k-line)", color: "var(--k-t2)" }}
      >
        {lines[lines.length - 1]}
      </div>
    </div>
  );
}
