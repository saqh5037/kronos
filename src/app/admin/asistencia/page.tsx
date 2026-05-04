import {
  getTodayClasses,
  getTodayStats,
  getAttendanceByDay,
  getAttendanceHeatmap,
  listFrequentNoShows,
  type AttendanceByDayPoint,
  type AttendanceHeatmapCell,
  type FrequentNoShow,
} from "@/server/actions/attendance";
import { getClassRoster, type ClassRoster } from "@/server/actions/bookings";
import { rangeFromParams, previousRange, formatRange } from "@/lib/dates";
import { MetricDelta } from "@/components/charts/MetricDelta";
import { AsistenciaFilters } from "./_components/AsistenciaFilters";
import { AttendanceBarChart } from "./_components/AttendanceBarChart";
import { DayHourHeatmap } from "./_components/DayHourHeatmap";
import { BulkRoster } from "./_components/BulkRoster";

export const metadata = { title: "Kronos — Asistencia" };

type SearchParams = {
  preset?: string;
  from?: string;
  to?: string;
};

function summarize(points: AttendanceByDayPoint[]) {
  let attended = 0;
  let noShow = 0;
  let booked = 0;
  let capacity = 0;
  for (const p of points) {
    attended += p.attended;
    noShow += p.noShow;
    booked += p.booked;
    capacity += p.capacity;
  }
  const completed = attended + noShow;
  return {
    attended,
    noShow,
    booked,
    capacity,
    attendanceRate: completed === 0 ? 0 : attended / completed,
    noShowRate: completed === 0 ? 0 : noShow / completed,
    capacityUtil: capacity === 0 ? 0 : attended / capacity,
  };
}

export default async function AsistenciaPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const range = rangeFromParams({
    preset: sp.preset ?? "last7",
    from: sp.from,
    to: sp.to,
  });
  const prev = previousRange(range);

  let classesToday: Awaited<ReturnType<typeof getTodayClasses>> = [];
  let statsToday = {
    totalClasses: 0,
    totalBooked: 0,
    totalAttended: 0,
    totalNoShow: 0,
    attendanceRate: 0,
  };
  let rangePoints: AttendanceByDayPoint[] = [];
  let prevPoints: AttendanceByDayPoint[] = [];
  let heatmap: AttendanceHeatmapCell[] = [];
  let noShows: FrequentNoShow[] = [];
  let rosters: ClassRoster[] = [];

  try {
    const [tcl, stt, rangeData, prevData, hm, ns] = await Promise.all([
      getTodayClasses(),
      getTodayStats(),
      getAttendanceByDay({ dateFrom: range.from, dateTo: range.to }),
      getAttendanceByDay({ dateFrom: prev.from, dateTo: prev.to }),
      getAttendanceHeatmap({ dateFrom: range.from, dateTo: range.to }),
      listFrequentNoShows({ windowDays: 30, threshold: 3 }),
    ]);
    classesToday = tcl;
    statsToday = stt;
    rangePoints = rangeData;
    prevPoints = prevData;
    heatmap = hm;
    noShows = ns;
    rosters = await Promise.all(classesToday.map((c) => getClassRoster(c.id)));
  } catch {
    // BD/sesión ausentes
  }

  const rangeStats = summarize(rangePoints);
  const prevStats = summarize(prevPoints);

  const today = new Date();
  const todayLabel = today.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const pct = (v: number) => `${Math.round(v * 100)}%`;

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="k-eyebrow mb-1">Operación</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Asistencia
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
          {formatRange(range)} · {rangeStats.attended} asistencias en el rango
        </p>
      </div>

      <AsistenciaFilters />

      {/* KPIs rango */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Asistencia rango"
          value={pct(rangeStats.attendanceRate)}
          tone="recovery"
          delta={
            <MetricDelta
              current={rangeStats.attendanceRate}
              previous={prevStats.attendanceRate}
              goodWhen="higher"
              formatter={(v) => `${(v * 100).toFixed(1)}%`}
            />
          }
        />
        <KpiCard
          label="No-show rate"
          value={pct(rangeStats.noShowRate)}
          tone={rangeStats.noShowRate > 0.15 ? "pr" : "strain"}
          delta={
            <MetricDelta
              current={rangeStats.noShowRate}
              previous={prevStats.noShowRate}
              goodWhen="lower"
              formatter={(v) => `${(v * 100).toFixed(1)}%`}
            />
          }
        />
        <KpiCard
          label="Capacidad usada"
          value={pct(rangeStats.capacityUtil)}
          tone="strain"
          subtitle={`${rangeStats.attended}/${rangeStats.capacity}`}
        />
        <KpiCard
          label="No-shows recurrentes"
          value={String(noShows.length)}
          tone={noShows.length > 0 ? "pr" : undefined}
          subtitle={noShows.length > 0 ? "3+ no-shows en 30d" : "Todos al día"}
        />
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="k-card p-4">
          <p className="k-eyebrow mb-2">
            Asistencia diaria · {formatRange(range)}
          </p>
          {rangePoints.length > 0 &&
          rangePoints.some((p) => p.attended + p.noShow + p.booked > 0) ? (
            <AttendanceBarChart data={rangePoints} />
          ) : (
            <p className="py-10 text-center text-sm text-[var(--text-3)]">
              Sin actividad en el rango
            </p>
          )}
        </div>
        <div className="k-card p-4">
          <p className="k-eyebrow mb-2">Utilización por día y hora</p>
          {heatmap.length > 0 ? (
            <DayHourHeatmap cells={heatmap} />
          ) : (
            <p className="py-10 text-center text-sm text-[var(--text-3)]">
              Sin datos en el rango
            </p>
          )}
        </div>
      </div>

      {/* No-shows recurrentes */}
      {noShows.length > 0 && (
        <section className="mb-6">
          <p className="k-eyebrow mb-3" style={{ color: "var(--pr)" }}>
            🔁 No-shows recurrentes ({noShows.length})
          </p>
          <div className="k-card overflow-hidden">
            <table className="k-table text-sm">
              <thead>
                <tr>
                  <th>Atleta</th>
                  <th>No-shows</th>
                  <th>Último</th>
                </tr>
              </thead>
              <tbody>
                {noShows.map((ns) => (
                  <tr key={ns.athleteId}>
                    <td className="font-medium">{ns.athleteName}</td>
                    <td>
                      <span className="k-chip k-chip-pr text-[10px]">
                        {ns.noShowCount}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-[var(--text-3)]">
                      {ns.lastNoShowAt
                        ? ns.lastNoShowAt.toLocaleDateString("es-MX", {
                            day: "2-digit",
                            month: "short",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Hoy */}
      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <p className="k-eyebrow capitalize">Clases de hoy · {todayLabel}</p>
          <p className="font-mono text-xs text-[var(--text-3)]">
            {statsToday.totalAttended}/{statsToday.totalBooked} asistidos hoy
          </p>
        </div>
        {classesToday.length === 0 ? (
          <div className="k-card p-6 text-center">
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              No hay clases programadas para hoy.
            </p>
          </div>
        ) : (
          <BulkRoster rosters={rosters} />
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
