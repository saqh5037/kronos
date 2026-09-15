import Link from "next/link";
import {
  getReports,
  getRevenueByMonth,
  getAthletesByMonth,
  type Reports,
  type RevenueByMonthPoint,
  type AthletesByMonthPoint,
} from "@/server/actions/reports";
import {
  getReadinessAverage,
  type ReadinessAverage,
} from "@/server/actions/surveys";
import { MetricDelta } from "@/components/charts/MetricDelta";
import { RevenueLineChart } from "./_components/RevenueLineChart";
import { NewChurnBarChart } from "./_components/NewChurnBarChart";
import {
  ExportAthletesMonths,
  ExportChurnRisk,
  ExportRevenueMonths,
} from "./_components/ReportesExport";
import { getChurnRiskList, type ChurnRiskRow } from "@/server/analytics/churn";
import ChurnRiskTable from "@/components/admin/ChurnRiskTable";
import { formatMXN } from "@/lib/format";
import { planTypeLabel } from "@/lib/labels";
import { rangeFromParams } from "@/lib/dates";
import { DateRangePicker } from "@/components/data/DateRangePicker";
import {
  hasEnoughReadinessData,
  responseCountLabel,
  rollingMonthsLabel,
} from "./_lib/period-label";

export const metadata = { title: "Kronos — Reportes" };

type SearchParams = {
  preset?: string;
  from?: string;
  to?: string;
};

const fmtPct = (v: number) => `${Math.round(v * 100)} %`;

export default async function ReportesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  // The picker is back and it drives the query. It was removed because
  // `getReports()` ignored its range — a control that changes nothing is worse
  // than none — and `getReports` now takes the period, so the fix is to wire
  // the control rather than to hide it. Default: "este mes", the window the
  // headline copy has always claimed.
  const range = rangeFromParams({
    preset: sp.preset ?? "thisMonth",
    from: sp.from,
    to: sp.to,
  });
  const periodInput = range.preset
    ? { preset: range.preset }
    : { from: range.from, to: range.to };

  let r: Reports | null = null;
  let revenue12m: RevenueByMonthPoint[] = [];
  let athletes12m: AthletesByMonthPoint[] = [];
  let readiness: ReadinessAverage | null = null;
  let churnRisk: ChurnRiskRow[] = [];

  try {
    // Morosos come from `getReports().overdueCount` — the authoritative count
    // of the same shared rule Pagos shows. The page used to fetch the row list
    // and print `.length`, which a `limit: 50` could silently truncate.
    [r, revenue12m, athletes12m, churnRisk] = await Promise.all([
      getReports(periodInput),
      getRevenueByMonth(12),
      getAthletesByMonth(12),
      getChurnRiskList(),
    ]);
    readiness = await getReadinessAverage({ sinceDays: 7 });
  } catch {
    // BD/sesión ausente
  }

  if (!r) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <span className="k-eyebrow-bar">Análisis</span>
          <h1
            className="k-h-italic font-display mt-2 text-[32px] leading-[1] font-extrabold tracking-[-0.02em] md:text-[38px]"
            style={{ color: "var(--k-t1)" }}
          >
            Re<em>portes</em>
          </h1>
        </div>
        <div className="k-card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--k-t2)" }}>
            Sin datos disponibles. Verifica que la base esté conectada.
          </p>
        </div>
      </div>
    );
  }

  // The label of the window the data actually covers, straight off the
  // summary — never a literal, never `generatedAt`.
  const periodLabel = r.period.label;

  const totalRevenue12m = revenue12m.reduce((s, p) => s + p.revenue, 0);
  const totalNew12m = athletes12m.reduce((s, p) => s + p.newAthletes, 0);
  const totalChurn12m = athletes12m.reduce(
    (s, p) => s + p.churnedMemberships,
    0,
  );
  const twelveMonthLabel = rollingMonthsLabel(12);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="k-eyebrow-bar">Análisis</span>
          <h1
            className="k-h-italic font-display mt-2 text-[32px] leading-[1] font-extrabold tracking-[-0.02em] md:text-[38px]"
            style={{ color: "var(--k-t1)" }}
          >
            Re<em>portes</em>
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
            {periodLabel} · lo que pasó en tu box
          </p>
        </div>
        <DateRangePicker />
      </div>

      {/* Hero KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Ingresos"
          value={formatMXN(r.monthRevenue)}
          period={periodLabel}
          tone="accent"
          delta={
            <MetricDelta
              current={r.monthRevenue}
              previous={r.prevMonthRevenue}
              goodWhen="higher"
            />
          }
        />
        <KpiCard
          label="Ingreso recurrente"
          value={formatMXN(Math.round(r.mrr))}
          period="por mes equivalente"
        />
        <KpiCard
          label="Atletas activos"
          value={String(r.activeAthletes)}
          period={periodLabel}
          subtitle={`+${r.newAthletesMonth} nuevos · ${r.pausedAthletes} pausados`}
        />
        <KpiCard
          label="En riesgo"
          value={String(r.athletesAtRisk)}
          period={periodLabel}
          tone={r.athletesAtRisk > 0 ? "warning" : undefined}
          subtitle={
            r.overdueCount > 0
              ? `${r.overdueCount} con adeudo · ${formatMXN(r.overdueTotal)}`
              : "Nadie con adeudo"
          }
        />
        <KpiCard
          label="Tasa de asistencia"
          value={fmtPct(r.attendanceRate)}
          period={periodLabel}
          tone={r.attendanceRate >= 0.65 ? "accent" : "warning"}
          subtitle={`${r.monthAttended} de ${r.monthAttended + r.monthNoShow} reservas`}
        />
      </div>

      {/* Twelve-month charts */}
      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="k-card p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
            <p className="k-eyebrow">Ingresos · {twelveMonthLabel}</p>
            <div className="flex items-center gap-3">
              <span className="font-display text-xs text-[var(--k-t3)]">
                total {formatMXN(totalRevenue12m)}
              </span>
              <ExportRevenueMonths rows={revenue12m} />
            </div>
          </div>
          {revenue12m.some((p) => p.revenue > 0) ? (
            <RevenueLineChart data={revenue12m} />
          ) : (
            <p className="py-10 text-center text-sm text-[var(--k-t3)]">
              Sin cobros en los últimos 12 meses
            </p>
          )}
        </div>
        <div className="k-card p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
            <p className="k-eyebrow">Altas y bajas · {twelveMonthLabel}</p>
            <div className="flex items-center gap-3">
              <span className="font-display text-xs text-[var(--k-t3)]">
                +{totalNew12m} / −{totalChurn12m}
              </span>
              <ExportAthletesMonths rows={athletes12m} />
            </div>
          </div>
          {athletes12m.some((p) => p.newAthletes + p.churnedMemberships > 0) ? (
            <NewChurnBarChart data={athletes12m} />
          ) : (
            <p className="py-10 text-center text-sm text-[var(--k-t3)]">
              Sin altas ni bajas en los últimos 12 meses
            </p>
          )}
        </div>
      </div>

      {/* Readiness */}
      {readiness !== null && (
        <div className="mb-6">
          <ReadinessTile readiness={readiness} />
        </div>
      )}

      {/* Churn risk */}
      <div className="mb-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <span className="k-eyebrow-bar">En riesgo de dejar el box</span>
          <div className="flex items-center gap-3">
            <span className="font-display text-xs text-[var(--k-t3)]">
              {churnRisk.length} atleta{churnRisk.length === 1 ? "" : "s"}
            </span>
            <ExportChurnRisk
              rows={churnRisk.map((c) => ({
                name: c.name,
                severity: c.severity,
                signalCount: c.signalCount,
                reasons: c.reasons.join(" · "),
                daysSinceLastAttended: c.daysSinceLastAttended,
              }))}
            />
          </div>
        </div>
        <p className="mb-3 text-xs" style={{ color: "var(--k-t3)" }}>
          Esta lista mira la asistencia: quién dejó de venir o canceló de más.
          No mira el dinero.{" "}
          {r.overdueCount > 0 ? (
            <>
              Por adeudo hay{" "}
              <Link
                href="/admin/pagos#morosos"
                className="underline decoration-dotted"
                style={{ color: "var(--k-accent)" }}
              >
                {r.overdueCount} moroso
                {r.overdueCount === 1 ? "" : "s"} en Pagos
              </Link>
              , que es otra pregunta.
            </>
          ) : (
            <>Por adeudo, hoy no hay morosos en Pagos.</>
          )}
        </p>
        <ChurnRiskTable rows={churnRisk} />
      </div>

      {/* Activity */}
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <SimpleStat
          label="Clases impartidas"
          value={String(r.monthClassesHeld)}
          period={periodLabel}
        />
        <SimpleStat
          label="Scores registrados"
          value={String(r.monthScores)}
          period={periodLabel}
          subtitle={`${r.monthPRs} PRs nuevos`}
        />
        <SimpleStat
          label="Reservas"
          value={String(r.monthBookings)}
          period={periodLabel}
          subtitle={`${r.monthAttended} asistidas · ${r.monthNoShow} no-show`}
        />
      </div>

      {/* Top tables + plan distribution */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <TopTable
          title="Top WODs"
          subtitle={`Por scores registrados · ${periodLabel}`}
          rows={r.topWODs.map((w, i) => ({
            rank: i + 1,
            label: w.name,
            value: String(w.scoreCount),
          }))}
        />
        <TopTable
          title="Top atletas por asistencia"
          subtitle={`Clases asistidas · ${periodLabel}`}
          rows={r.topAttendees.map((a, i) => ({
            rank: i + 1,
            label: a.athleteName,
            value: String(a.attendedCount),
          }))}
        />
        <PlanDistribution distribution={r.planDistribution} />
      </div>
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
  period: string;
  subtitle?: string;
  tone?: "accent" | "warning";
  delta?: React.ReactNode;
}) {
  const color =
    tone === "accent"
      ? "var(--k-accent)"
      : tone === "warning"
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
      <p className="mt-1 text-[11px]" style={{ color: "var(--k-t3)" }}>
        {period}
        {subtitle ? ` · ${subtitle}` : ""}
      </p>
    </div>
  );
}

function SimpleStat({
  label,
  value,
  period,
  subtitle,
}: {
  label: string;
  value: string;
  period: string;
  subtitle?: string;
}) {
  return (
    <div className="k-card p-3">
      <p className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
        {label}
      </p>
      <p className="font-display mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-[11px]" style={{ color: "var(--k-t3)" }}>
        {period}
        {subtitle ? ` · ${subtitle}` : ""}
      </p>
    </div>
  );
}

function TopTable({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle?: string;
  rows: { rank: number; label: string; value: string }[];
}) {
  return (
    <div className="k-card overflow-hidden">
      <div
        className="border-b px-4 py-3"
        style={{ borderColor: "var(--k-line)" }}
      >
        <p className="font-display text-base font-bold">{title}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs" style={{ color: "var(--k-t3)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-center text-xs" style={{ color: "var(--k-t3)" }}>
          Sin datos en el período.
        </p>
      ) : (
        <ul className="flex flex-col">
          {rows.map((r) => (
            <li
              key={r.rank}
              className="flex items-center justify-between border-b px-4 py-2.5 last:border-b-0"
              style={{ borderColor: "var(--k-line)" }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="font-display w-5 text-xs"
                  style={{
                    color:
                      r.rank === 1
                        ? "var(--k-accent)"
                        : r.rank <= 3
                          ? "var(--k-t2)"
                          : "var(--k-t3)",
                  }}
                >
                  {r.rank}
                </span>
                <span className="truncate text-sm">{r.label}</span>
              </div>
              <span
                className="font-display flex-shrink-0 text-sm font-bold"
                style={{
                  color: r.rank === 1 ? "var(--k-accent)" : "var(--k-t1)",
                }}
              >
                {r.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlanDistribution({
  distribution,
}: {
  distribution: { type: string; count: number; revenue: number }[];
}) {
  const totalCount = distribution.reduce((acc, d) => acc + d.count, 0);
  /* The bar is labelled with money, so it is scaled by money. Scaling by head
     count made the Anual plan — the biggest earner — the shortest bar. */
  const maxRevenue = distribution.reduce((m, d) => Math.max(m, d.revenue), 0);
  return (
    <div className="k-card overflow-hidden">
      <div
        className="border-b px-4 py-3"
        style={{ borderColor: "var(--k-line)" }}
      >
        <p className="font-display text-base font-bold">Ingresos por plan</p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--k-t3)" }}>
          {totalCount} membresía{totalCount === 1 ? "" : "s"} activa
          {totalCount === 1 ? "" : "s"}
        </p>
      </div>
      {distribution.length === 0 ? (
        <p className="p-4 text-center text-xs" style={{ color: "var(--k-t3)" }}>
          Sin membresías activas.
        </p>
      ) : (
        <ul className="flex flex-col gap-3 p-3">
          {distribution.map((d) => {
            const pct = maxRevenue === 0 ? 0 : (d.revenue / maxRevenue) * 100;
            return (
              <li key={d.type}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold">
                    {planTypeLabel[d.type as keyof typeof planTypeLabel] ??
                      d.type}
                  </span>
                  <span style={{ color: "var(--k-t3)" }}>
                    {formatMXN(d.revenue)} · {d.count} activa
                    {d.count === 1 ? "" : "s"}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full"
                  style={{ background: "var(--k-elevated)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: "var(--k-accent)" }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ReadinessTile({ readiness }: { readiness: ReadinessAverage }) {
  const scorePct = Math.round(readiness.score * 100);
  const enough = hasEnoughReadinessData(readiness.count, readiness.total);
  const countLabel = responseCountLabel(readiness.count, readiness.total);

  const tone =
    scorePct >= 70
      ? "var(--k-accent)"
      : scorePct >= 40
        ? "var(--k-t2)"
        : "var(--k-warning)";

  return (
    <div className="k-card p-4">
      <p className="k-eyebrow mb-1" style={{ color: "var(--k-t2)" }}>
        Cómo llega tu box
      </p>
      {/* The sample comes first: a 100 % built on one answer is not a box-wide number */}
      <p className="text-sm" style={{ color: "var(--k-t1)" }}>
        {countLabel}
        <span className="ml-1" style={{ color: "var(--k-t3)" }}>
          · últimos 7 días
        </span>
      </p>

      {enough ? (
        <>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className="font-display text-3xl font-bold"
              style={{ color: tone }}
            >
              {scorePct} %
            </span>
            <span className="text-sm" style={{ color: "var(--k-t2)" }}>
              de energía promedio
            </span>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full"
            style={{ background: "var(--k-surface)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${scorePct}%`, background: tone }}
            />
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm" style={{ color: "var(--k-t2)" }}>
          Sin datos suficientes para hablar del box. Con menos de una de cada
          cinco respuestas, el promedio dice más de quien contestó que del box.
        </p>
      )}
    </div>
  );
}
