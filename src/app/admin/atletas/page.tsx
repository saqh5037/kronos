import Link from "next/link";
import {
  listAthletesPaged,
  getAthleteGrowthByDay,
  getAtRiskAthletes,
  type AthleteRow,
  type AthleteGrowthPoint,
  type AtRiskAthlete,
} from "@/server/actions/athletes";
import { listPendingInvitations } from "@/server/actions/athlete-invitations";
import AthleteForm from "@/components/AthleteForm";
import { rangeFromParams, previousRange, formatRange } from "@/lib/dates";
import { MetricDelta } from "@/components/charts/MetricDelta";
import type { AthleteStatus } from "@prisma/client";
import { AtletasFilters } from "./_components/AtletasFilters";
import { GrowthChart } from "./_components/GrowthChart";
import { AtletasTable } from "./_components/AtletasTable";

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
  const range = rangeFromParams({
    preset: sp.preset,
    from: sp.from,
    to: sp.to,
  });
  const prev = previousRange(range);
  const search = (sp.q ?? "").trim() || undefined;
  const status = parseStatus(sp.status);
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
  let activeNow = 0;
  let newInRange = 0;
  let newPrev = 0;
  let pendingInvitationsCount = 0;

  try {
    const [
      tableRes,
      growthData,
      atRiskData,
      allActive,
      newInRangeData,
      newPrevData,
    ] = await Promise.all([
      listAthletesPaged({
        dateFrom: range.from,
        dateTo: range.to,
        search,
        status,
        page,
        pageSize: PAGE_SIZE,
      }),
      getAthleteGrowthByDay({ dateFrom: range.from, dateTo: range.to }),
      getAtRiskAthletes({ inactivityDays: 14, limit: 20 }),
      listAthletesPaged({
        status: "ACTIVE" as AthleteStatus,
        page: 1,
        pageSize: 1,
      }),
      listAthletesPaged({
        dateFrom: range.from,
        dateTo: range.to,
        page: 1,
        pageSize: 1,
      }),
      listAthletesPaged({
        dateFrom: prev.from,
        dateTo: prev.to,
        page: 1,
        pageSize: 1,
      }),
    ]);
    rows = tableRes;
    growth = growthData;
    atRisk = atRiskData;
    activeNow = allActive.total;
    newInRange = newInRangeData.total;
    newPrev = newPrevData.total;
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

  return (
    <div className="p-8">
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
            {formatRange(range)} · {rows.total} en filtro · {activeNow} activos
            totales
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
          label="Activos totales"
          value={String(activeNow)}
          tone="moss"
        />
        <KpiCard
          label="Nuevos rango"
          value={String(newInRange)}
          tone="steel"
          delta={
            <MetricDelta
              current={newInRange}
              previous={newPrev}
              goodWhen="higher"
              formatter={(v) => v.toFixed(0)}
            />
          }
        />
        <KpiCard
          label="En filtro"
          value={String(rows.total)}
          subtitle="Atletas que cumplen los filtros"
        />
        <KpiCard
          label="En riesgo"
          value={String(atRisk.length)}
          tone={atRisk.length > 0 ? "ember" : undefined}
          subtitle={
            atRisk.length > 0
              ? "Sin asistencia 14d+ o vencidos"
              : "Todos al día"
          }
        />
      </div>

      {/* Growth chart */}
      <div className="mb-6 k-card p-4">
        <p className="k-eyebrow mb-2">Crecimiento · {formatRange(range)}</p>
        {growth.length > 0 ? (
          <GrowthChart data={growth} />
        ) : (
          <p className="py-10 text-center text-sm text-[var(--k-t3)]">
            Sin datos en el rango
          </p>
        )}
      </div>

      {/* En riesgo */}
      {atRisk.length > 0 && (
        <section className="mb-6">
          <p className="k-eyebrow mb-3" style={{ color: "var(--k-warning)" }}>
            🔥 Atletas en riesgo ({atRisk.length})
          </p>
          <div className="k-card overflow-hidden">
            <table className="k-table text-sm">
              <thead>
                <tr>
                  <th>Atleta</th>
                  <th>Días sin asistir</th>
                  <th>Membresía</th>
                </tr>
              </thead>
              <tbody>
                {atRisk.map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium">
                      {a.firstName} {a.lastName}
                    </td>
                    <td>
                      <span className="k-chip k-chip-pr text-[10px]">
                        {a.daysSinceLastAttendance ?? "Nunca"}
                        {a.daysSinceLastAttendance !== null ? "d" : ""}
                      </span>
                    </td>
                    <td className="text-xs">
                      {a.hasOverdueMembership ? (
                        <span className="text-[var(--k-danger)]">Vencida</span>
                      ) : (
                        <span className="text-[var(--k-t3)]">Vigente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            dateFrom: range.from,
            dateTo: range.to,
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
  subtitle,
  tone,
  delta,
}: {
  label: string;
  value: string;
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
      {subtitle ? (
        <p className="mt-1 text-xs text-[var(--k-t3)]">{subtitle}</p>
      ) : null}
    </div>
  );
}
