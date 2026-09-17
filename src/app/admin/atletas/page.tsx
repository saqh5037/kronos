import Link from "next/link";
import { Flame } from "lucide-react";
import {
  listAthletesPaged,
  getAthleteCounts,
  getAthleteGrowthByDay,
  getAtRiskAthletes,
  type AthleteCounts,
  type AthleteRow,
  type AthleteGrowthPoint,
  type AtRiskAthlete,
} from "@/server/actions/athletes";
import { listPendingInvitations } from "@/server/actions/athlete-invitations";
import AthleteForm from "@/components/AthleteForm";
import { rangeFromParams, previousRange } from "@/lib/dates";
import { MetricDelta } from "@/components/charts/MetricDelta";
import type { AthleteStatus } from "@prisma/client";
import { athleteStatusLabel } from "@/lib/labels";
import { periodLabel } from "../_lib/period";
import { AT_RISK_DEFAULT_INACTIVITY_DAYS } from "@/server/period-summary/rules";
import { AtletasFilters } from "./_components/AtletasFilters";
import { GrowthChart } from "./_components/GrowthChart";
import { AtletasTable } from "./_components/AtletasTable";
import { AtRiskTable } from "./_components/AtRiskTable";

export const metadata = { title: "Kronos — Atletas" };

type SearchParams = {
  preset?: string;
  from?: string;
  to?: string;
  q?: string;
  status?: string;
  page?: string;
};

const PAGE_SIZE = 25;

const VALID_STATUS = new Set<AthleteStatus>([
  "ACTIVE",
  "PAUSED",
  "DROPIN",
  "CANCELLED",
]);

function parseStatus(v?: string): AthleteStatus | undefined {
  return v && VALID_STATUS.has(v as AthleteStatus)
    ? (v as AthleteStatus)
    : undefined;
}

function parsePage(v?: string): number {
  const n = parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function AtletasPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};

  // The list defaults to EVERY active athlete. The old default ("últimos 30
  // días" on createdAt) hid 34 of 42 members behind a date chip nobody set
  // (audit 2026-09-15, /admin/atletas P1).
  const hasDateFilter = Boolean(sp.preset || (sp.from && sp.to));
  const range = hasDateFilter
    ? rangeFromParams({ preset: sp.preset, from: sp.from, to: sp.to })
    : null;
  const prev = range ? previousRange(range) : null;
  const search = (sp.q ?? "").trim() || undefined;
  const status = parseStatus(sp.status) ?? (sp.status ? undefined : "ACTIVE");
  const page = parsePage(sp.page);

  let rows: {
    rows: AthleteRow[];
    total: number;
    page: number;
    pageSize: number;
  } = {
    rows: [],
    total: 0,
    page,
    pageSize: PAGE_SIZE,
  };
  let growth: AthleteGrowthPoint[] = [];
  let atRisk: AtRiskAthlete[] = [];
  let counts: AthleteCounts | null = null;
  let newInRange = 0;
  let newPrev = 0;
  let pendingInvitationsCount = 0;

  try {
    const [
      tableRes,
      growthData,
      atRiskData,
      countsData,
      newInRangeData,
      newPrevData,
    ] = await Promise.all([
      listAthletesPaged({
        dateFrom: range?.from,
        dateTo: range?.to,
        search,
        status,
        page,
        pageSize: PAGE_SIZE,
      }),
      range
        ? getAthleteGrowthByDay({ dateFrom: range.from, dateTo: range.to })
        : Promise.resolve([]),
      getAtRiskAthletes({
        inactivityDays: AT_RISK_DEFAULT_INACTIVITY_DAYS,
        limit: 20,
      }),
      // "Activos" and "(N) en riesgo" come from the shared summary, so this
      // page, the dashboard and Reportes print the same two numbers. The
      // at-risk LIST below is capped at 20; its `.length` is not the count.
      getAthleteCounts(
        range ? { from: range.from, to: range.to } : { preset: "last30" },
      ),
      range
        ? listAthletesPaged({
            dateFrom: range.from,
            dateTo: range.to,
            page: 1,
            pageSize: 1,
          })
        : Promise.resolve(null),
      prev
        ? listAthletesPaged({
            dateFrom: prev.from,
            dateTo: prev.to,
            page: 1,
            pageSize: 1,
          })
        : Promise.resolve(null),
    ]);
    rows = tableRes;
    growth = growthData;
    atRisk = atRiskData;
    counts = countsData;
    newInRange = newInRangeData?.total ?? 0;
    newPrev = newPrevData?.total ?? 0;
    try {
      const pending = await listPendingInvitations();
      pendingInvitationsCount = pending.filter(
        (p) => p.status === "PENDING",
      ).length;
    } catch {
      // tabla nueva, ignorar
    }
  } catch {
    // BD/sesión ausente
  }

  // One source of truth: the headline count IS the table's count, so the page
  // can never say "42 activos totales" over a list of 8 (audit S4).
  const statusLabel = status ? athleteStatusLabel[status] : null;
  const scopeLabel = statusLabel
    ? `${rows.total} ${statusLabel.toLowerCase()}${rows.total === 1 ? "" : "s"}`
    : `${rows.total} atleta${rows.total === 1 ? "" : "s"}`;
  const activeCount = counts?.active ?? 0;
  const atRiskCount = counts?.atRisk ?? 0;
  // Every KPI names the window it was computed for. Pagos and Reportes
  // already require it; this page printed four numbers with no window at all
  // (audit 2026-09-15, S4 / ADM-12). The list numbers follow the filter, the
  // roster numbers follow the shared summary — and each says which.
  const listPeriodLabel = range ? periodLabel(range) : "Todos los registros";
  const summaryPeriodLabel = counts?.period.label ?? "Últimos 30 días";
  const subtitle = [
    range ? periodLabel(range) : "Todos los registros",
    scopeLabel,
    search ? `búsqueda “${search}”` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="k-eyebrow-bar">CRM · Atletas</span>
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span
              className="font-display text-[26px] leading-none"
              style={{ color: "var(--k-accent)" }}
            >
              Tus
            </span>
            <h1
              className="k-h-italic font-display font-extrabold text-[38px] leading-[1] tracking-[-0.02em]"
              style={{ color: "var(--k-t1)" }}
            >
              <em>atletas</em>
            </h1>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
            {subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/atletas/invitar"
            className="k-btn-ghost text-sm relative"
          >
            Invitar atletas
            {pendingInvitationsCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-[var(--k-accent)] text-[var(--k-accent-on)]">
                {pendingInvitationsCount}
              </span>
            )}
          </Link>
          <AthleteForm />
        </div>
      </div>

      <AtletasFilters />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label={statusLabel ? `${statusLabel}s en la lista` : "En la lista"}
          value={String(rows.total)}
          period={listPeriodLabel}
          tone="moss"
          subtitle={
            // The list count IS the table's count. When a filter narrows it,
            // the roster size from the shared summary is named next to it so
            // the two can be read together instead of contradicting.
            rows.total === activeCount
              ? "El mismo número que la tabla de abajo"
              : `${activeCount} activos en el box`
          }
        />
        <KpiCard
          label={range ? "Nuevos en el rango" : "Nuevos"}
          value={range ? String(newInRange) : "—"}
          period={range ? listPeriodLabel : "Elige un rango de fechas"}
          delta={
            range ? (
              <MetricDelta
                current={newInRange}
                previous={newPrev}
                goodWhen="higher"
              />
            ) : undefined
          }
        />
        <KpiCard
          label="Página"
          value={`${rows.page} de ${Math.max(1, Math.ceil(rows.total / rows.pageSize))}`}
          period={listPeriodLabel}
          subtitle={`${rows.pageSize} por página`}
        />
        <KpiCard
          label="En riesgo"
          value={String(atRiskCount)}
          period={summaryPeriodLabel}
          tone={atRiskCount > 0 ? "ember" : undefined}
          subtitle={
            atRiskCount > 0
              ? `Sin check-in ${AT_RISK_DEFAULT_INACTIVITY_DAYS}+ días o con adeudo · ${counts?.overdueCount ?? 0} morosos`
              : "Todos al día"
          }
        />
      </div>

      {/* Growth chart — only meaningful with a date range selected */}
      {range ? (
        <div className="mb-6 k-card p-4">
          <p className="k-eyebrow mb-2">Crecimiento · {periodLabel(range)}</p>
          {growth.length > 0 ? (
            <GrowthChart data={growth} />
          ) : (
            <p className="py-10 text-center text-sm text-[var(--k-t2)]">
              Sin datos en el rango
            </p>
          )}
        </div>
      ) : null}

      {/* En riesgo */}
      {atRisk.length > 0 && (
        <section className="mb-6">
          <p
            className="k-eyebrow mb-3 inline-flex items-center gap-1.5"
            style={{ color: "var(--k-warning)" }}
          >
            <Flame size={14} aria-hidden />
            Atletas en riesgo ({atRiskCount})
          </p>
          <AtRiskTable rows={atRisk} totalCount={atRiskCount} />
        </section>
      )}

      {/* Table */}
      <section>
        <AtletasTable
          rows={rows.rows}
          total={rows.total}
          page={rows.page}
          pageSize={rows.pageSize}
          filterValues={{
            dateFrom: range?.from,
            dateTo: range?.to,
            search,
            status,
          }}
        />
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  period,
  subtitle,
  tone,
  delta,
}: {
  label: string;
  value: string;
  /** Required: a number without its window is not a number an owner can use. */
  period: string;
  subtitle?: string;
  tone?: "moss" | "steel" | "ember";
  delta?: React.ReactNode;
}) {
  const color =
    tone === "moss"
      ? "var(--k-accent)"
      : tone === "ember"
        ? "var(--k-warning)"
        : "var(--k-t1)";
  return (
    <div className="k-card p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
          {label}
        </p>
        {delta}
      </div>
      <p className="font-display mt-1 text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-[var(--k-t3)]">
        {period}
        {subtitle ? ` · ${subtitle}` : ""}
      </p>
    </div>
  );
}
