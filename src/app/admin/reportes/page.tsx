import { getReports, type Reports } from "@/server/actions/reports";
import { KPI, SimpleCard } from "@/components/kronos/StatCard";

export const metadata = { title: "Kronos — Reportes" };

export default async function ReportesPage() {
  let r: Reports | null = null;
  try {
    r = await getReports();
  } catch {
    // BD/sesión ausente
  }

  if (!r) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <p className="k-eyebrow mb-1">Análisis</p>
          <h1 className="font-display font-bold text-3xl tracking-tight">
            Reportes
          </h1>
        </div>
        <div
          className="p-6 rounded-xl border text-center"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
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

  return (
    <div className="p-8">
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="k-eyebrow mb-1">Análisis</p>
          <h1 className="font-display font-bold text-3xl tracking-tight">
            Reportes
          </h1>
          <p
            className="text-sm mt-1 capitalize"
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

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <KPI
          label="Ingresos del mes"
          value={`$${r.monthRevenue.toLocaleString("es-MX")}`}
          tone="recovery"
          delta={r.revenueDelta}
        />
        <KPI
          label="MRR estimado"
          value={`$${Math.round(r.mrr).toLocaleString("es-MX")}`}
          tone="strain"
          subtitle="por mes equivalente"
        />
        <KPI
          label="Atletas activos"
          value={String(r.activeAthletes)}
          subtitle={`+${r.newAthletesMonth} este mes`}
        />
        <KPI
          label="Tasa de asistencia"
          value={`${Math.round(r.attendanceRate * 100)}%`}
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

      {/* Comparativo mes vs mes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <ComparisonCard
          label="Revenue mes vs mes"
          current={r.monthRevenue}
          previous={r.prevMonthRevenue}
          format="currency"
        />
        <SimpleCard label="Clases del mes" value={String(r.monthClassesHeld)} />
        <SimpleCard
          label="Scores subidos"
          value={String(r.monthScores)}
          subtitle={`${r.monthPRs} PRs nuevos`}
        />
      </div>

      {/* Top tables + plan distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

function ComparisonCard({
  label,
  current,
  previous,
  format,
}: {
  label: string;
  current: number;
  previous: number;
  format: "currency" | "number";
}) {
  const fmt = (n: number) =>
    format === "currency"
      ? `$${n.toLocaleString("es-MX")}`
      : n.toLocaleString("es-MX");
  const delta = previous === 0 ? 0 : (current - previous) / previous;
  const max = Math.max(current, previous, 1);

  return (
    <div
      className="p-4 rounded-xl border"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <p className="k-eyebrow" style={{ color: "var(--text-2)" }}>
        {label}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <BarRow
          label="Este mes"
          value={current}
          max={max}
          fmt={fmt}
          color="var(--recovery)"
        />
        <BarRow
          label="Mes anterior"
          value={previous}
          max={max}
          fmt={fmt}
          color="var(--text-3)"
        />
      </div>
      {delta !== 0 && (
        <p
          className="text-xs font-mono mt-2"
          style={{
            color:
              delta > 0
                ? "var(--recovery)"
                : delta < 0
                  ? "var(--pr)"
                  : "var(--text-3)",
          }}
        >
          {delta > 0 ? "+" : ""}
          {Math.round(delta * 100)}%
        </p>
      )}
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  fmt,
  color,
}: {
  label: string;
  value: number;
  max: number;
  fmt: (n: number) => string;
  color: string;
}) {
  const pct = max === 0 ? 0 : (value / max) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span style={{ color: "var(--text-3)" }}>{label}</span>
        <span className="font-mono">{fmt(value)}</span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
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
    <div
      className="rounded-xl border"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: "var(--line)" }}
      >
        <p className="font-display font-bold text-base">{title}</p>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {rows.length === 0 ? (
        <p
          className="text-xs p-4 text-center"
          style={{ color: "var(--text-3)" }}
        >
          Sin datos este mes.
        </p>
      ) : (
        <ul className="flex flex-col">
          {rows.map((r) => (
            <li
              key={r.rank}
              className="px-4 py-2.5 border-b last:border-b-0 flex items-center justify-between"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="font-mono text-xs w-5"
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
                <span className="text-sm truncate">{r.label}</span>
              </div>
              <span
                className="font-mono font-bold text-sm flex-shrink-0"
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
    <div
      className="rounded-xl border"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: "var(--line)" }}
      >
        <p className="font-display font-bold text-base">
          Distribución de planes
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
          {totalCount} membership{totalCount === 1 ? "" : "s"} activa
          {totalCount === 1 ? "" : "s"}
        </p>
      </div>
      {distribution.length === 0 ? (
        <p
          className="text-xs p-4 text-center"
          style={{ color: "var(--text-3)" }}
        >
          Sin memberships activas.
        </p>
      ) : (
        <ul className="flex flex-col p-3 gap-3">
          {distribution.map((d) => {
            const pct = totalCount === 0 ? 0 : (d.count / totalCount) * 100;
            return (
              <li key={d.type}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono font-semibold">{d.type}</span>
                  <span style={{ color: "var(--text-3)" }}>
                    {d.count} · ${d.revenue.toLocaleString("es-MX")}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.06)" }}
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
