import {
  getReports,
  getRevenueByMonth,
  getAthletesByMonth,
  type Reports,
  type RevenueByMonthPoint,
  type AthletesByMonthPoint,
} from "@/server/actions/reports";
import { MetricDelta } from "@/components/charts/MetricDelta";
import { ReportesFilters } from "./_components/ReportesFilters";
import { RevenueLineChart } from "./_components/RevenueLineChart";
import { NewChurnBarChart } from "./_components/NewChurnBarChart";

export const metadata = { title: "Kronos — Reportes" };

const fmtMoney = (v: number) => `$${v.toLocaleString("es-MX")}`;
const fmtPct = (v: number) => `${Math.round(v * 100)}%`;

export default async function ReportesPage() {
  let r: Reports | null = null;
  let revenue12m: RevenueByMonthPoint[] = [];
  let athletes12m: AthletesByMonthPoint[] = [];

  try {
    [r, revenue12m, athletes12m] = await Promise.all([
      getReports(),
      getRevenueByMonth(12),
      getAthletesByMonth(12),
    ]);
  } catch {
    // BD/sesión ausente
  }

  if (!r) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <p className="k-eyebrow mb-1">Análisis</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Reportes
          </h1>
        </div>
        <div className="k-card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Sin datos disponibles. Verifica que la base esté conectada.
          </p>
        </div>
      </div>
    );
  }

  const monthLabel = r.generatedAt.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  const totalRevenue12m = revenue12m.reduce((s, p) => s + p.revenue, 0);
  const totalNew12m = athletes12m.reduce((s, p) => s + p.newAthletes, 0);
  const totalChurn12m = athletes12m.reduce(
    (s, p) => s + p.churnedMemberships,
    0,
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="k-eyebrow mb-1">Análisis</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Reportes
          </h1>
          <p
            className="mt-1 text-sm capitalize"
            style={{ color: "var(--text-2)" }}
          >
            {monthLabel} · actualizado{" "}
            {r.generatedAt.toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <ReportesFilters />

      {/* Hero KPIs con MetricDelta */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Ingresos del mes"
          value={fmtMoney(r.monthRevenue)}
          tone="recovery"
          delta={
            <MetricDelta
              current={r.monthRevenue}
              previous={r.prevMonthRevenue}
              goodWhen="higher"
              formatter={fmtMoney}
            />
          }
        />
        <KpiCard
          label="MRR estimado"
          value={fmtMoney(Math.round(r.mrr))}
          tone="strain"
          subtitle="por mes equivalente"
        />
        <KpiCard
          label="Atletas activos"
          value={String(r.activeAthletes)}
          subtitle={`+${r.newAthletesMonth} este mes · ${r.pausedAthletes} pausados`}
        />
        <KpiCard
          label="Tasa de asistencia"
          value={fmtPct(r.attendanceRate)}
          tone={
            r.attendanceRate >= 0.85
              ? "recovery"
              : r.attendanceRate >= 0.65
                ? "strain"
                : "pr"
          }
          subtitle={`${r.monthAttended}/${r.monthAttended + r.monthNoShow}`}
        />
      </div>

      {/* Revenue 12m chart */}
      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="k-card p-4">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="k-eyebrow">Revenue · últimos 12 meses</p>
            <span className="font-mono text-xs text-[var(--text-3)]">
              total {fmtMoney(totalRevenue12m)}
            </span>
          </div>
          {revenue12m.some((p) => p.revenue > 0) ? (
            <RevenueLineChart data={revenue12m} />
          ) : (
            <p className="py-10 text-center text-sm text-[var(--text-3)]">
              Sin pagos en los últimos 12 meses
            </p>
          )}
        </div>
        <div className="k-card p-4">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="k-eyebrow">Nuevos vs bajas · últimos 12 meses</p>
            <span className="font-mono text-xs text-[var(--text-3)]">
              +{totalNew12m} / −{totalChurn12m}
            </span>
          </div>
          {athletes12m.some((p) => p.newAthletes + p.churnedMemberships > 0) ? (
            <NewChurnBarChart data={athletes12m} />
          ) : (
            <p className="py-10 text-center text-sm text-[var(--text-3)]">
              Sin actividad en los últimos 12 meses
            </p>
          )}
        </div>
      </div>

      {/* Activity */}
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <SimpleStat label="Clases del mes" value={String(r.monthClassesHeld)} />
        <SimpleStat
          label="Scores subidos"
          value={String(r.monthScores)}
          subtitle={`${r.monthPRs} PRs nuevos`}
        />
        <SimpleStat
          label="Bookings del mes"
          value={String(r.monthBookings)}
          subtitle={`${r.monthAttended} asistidos · ${r.monthNoShow} no-show`}
        />
      </div>

      {/* Top tables + plan distribution */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <TopTable
          title="Top WODs del mes"
          subtitle="Por scores subidos"
          rows={r.topWODs.map((w, i) => ({
            rank: i + 1,
            label: w.name,
            value: String(w.scoreCount),
          }))}
        />
        <TopTable
          title="Top atletas asistencia"
          subtitle="Clases asistidas este mes"
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

function SimpleStat({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="k-card p-3">
      <p className="k-eyebrow" style={{ color: "var(--text-2)" }}>
        {label}
      </p>
      <p className="font-display mt-1 text-2xl font-bold">{value}</p>
      {subtitle ? (
        <p className="mt-1 text-xs text-[var(--text-3)]">{subtitle}</p>
      ) : null}
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
        style={{ borderColor: "var(--line)" }}
      >
        <p className="font-display text-base font-bold">{title}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-3)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {rows.length === 0 ? (
        <p
          className="p-4 text-center text-xs"
          style={{ color: "var(--text-3)" }}
        >
          Sin datos este mes.
        </p>
      ) : (
        <ul className="flex flex-col">
          {rows.map((r) => (
            <li
              key={r.rank}
              className="flex items-center justify-between border-b px-4 py-2.5 last:border-b-0"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="w-5 font-mono text-xs"
                  style={{
                    color:
                      r.rank === 1
                        ? "var(--recovery)"
                        : r.rank <= 3
                          ? "var(--strain)"
                          : "var(--text-3)",
                  }}
                >
                  {r.rank}
                </span>
                <span className="truncate text-sm">{r.label}</span>
              </div>
              <span
                className="flex-shrink-0 font-mono text-sm font-bold"
                style={{
                  color: r.rank === 1 ? "var(--recovery)" : "var(--text)",
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
  return (
    <div className="k-card overflow-hidden">
      <div
        className="border-b px-4 py-3"
        style={{ borderColor: "var(--line)" }}
      >
        <p className="font-display text-base font-bold">
          Distribución de planes
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-3)" }}>
          {totalCount} membership{totalCount === 1 ? "" : "s"} activa
          {totalCount === 1 ? "" : "s"}
        </p>
      </div>
      {distribution.length === 0 ? (
        <p
          className="p-4 text-center text-xs"
          style={{ color: "var(--text-3)" }}
        >
          Sin memberships activas.
        </p>
      ) : (
        <ul className="flex flex-col gap-3 p-3">
          {distribution.map((d) => {
            const pct = totalCount === 0 ? 0 : (d.count / totalCount) * 100;
            return (
              <li key={d.type}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold">{d.type}</span>
                  <span style={{ color: "var(--text-3)" }}>
                    {d.count} · {fmtMoney(d.revenue)}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full"
                  style={{ background: "var(--btn-ghost-bg)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: "var(--grad)",
                    }}
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
