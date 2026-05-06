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
import {
  AttendanceCinematicChart,
  NoShowCinematicChart,
} from "./_components/AttendanceCinematicChart";
import { DayHourHeatmap } from "./_components/DayHourHeatmap";
import { BulkRoster } from "./_components/BulkRoster";
import Eyebrow from "@/components/kronos/Eyebrow";

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
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Eyebrow>Operación</Eyebrow>
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <h1
            className="k-h-italic font-display font-extrabold text-[38px] leading-[1] tracking-[-0.02em]"
            style={{ color: "var(--text)" }}
          >
            Asis<em>tencia</em>
          </h1>
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
          {formatRange(range)} · {rangeStats.attended} asistencias en el rango
        </p>
      </div>

      {/* Sticky filter bar */}
      <div
        className="sticky top-0 z-10 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3 mb-4 backdrop-blur-md"
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <AsistenciaFilters />
      </div>

      {/* KPIs rango */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Asistencia rango"
          value={pct(rangeStats.attendanceRate)}
          tone="moss"
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
          tone={rangeStats.noShowRate > 0.15 ? "ember" : "steel"}
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
          tone="steel"
          subtitle={`${rangeStats.attended}/${rangeStats.capacity}`}
        />
        <KpiCard
          label="No-shows recurrentes"
          value={String(noShows.length)}
          tone={noShows.length > 0 ? "ember" : undefined}
          subtitle={noShows.length > 0 ? "3+ no-shows en 30d" : "Todos al día"}
        />
      </div>

      {/* Charts — homologadas con dashboard (cinematic) */}
      <div className="mb-6 grid grid-cols-1 gap-4">
        <div className="k-card p-5">
          <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
            <p className="k-eyebrow">Asistencia diaria</p>
            <p
              className="font-mono text-[10px] font-bold"
              style={{ color: "var(--text-3)" }}
            >
              {formatRange(range)}
            </p>
          </div>
          {rangePoints.length > 0 &&
          rangePoints.some((p) => p.attended + p.noShow + p.booked > 0) ? (
            <AttendanceCinematicChart data={rangePoints} />
          ) : (
            <p className="py-10 text-center text-sm text-[var(--text-3)]">
              Sin actividad en el rango
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="k-card p-5">
            <p className="k-eyebrow mb-3">No-shows diarios</p>
            {rangePoints.length > 0 && rangePoints.some((p) => p.noShow > 0) ? (
              <NoShowCinematicChart data={rangePoints} />
            ) : (
              <p className="py-10 text-center text-sm text-[var(--text-3)]">
                Sin no-shows en el rango ✓
              </p>
            )}
          </div>
          <div className="k-card p-5">
            <p className="k-eyebrow mb-3">Utilización por día y hora</p>
            {heatmap.length > 0 ? (
              <DayHourHeatmap cells={heatmap} />
            ) : (
              <p className="py-10 text-center text-sm text-[var(--text-3)]">
                Sin datos en el rango
              </p>
            )}
          </div>
        </div>
      </div>

      {/* No-shows recurrentes */}
      {noShows.length > 0 && (
        <section className="mb-6">
          <p className="k-eyebrow mb-3" style={{ color: "var(--ember)" }}>
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
  tone?: "moss" | "steel" | "ember";
  delta?: React.ReactNode;
}) {
  const color =
    tone === "moss"
      ? "var(--moss)"
      : tone === "steel"
        ? "var(--steel)"
        : tone === "ember"
          ? "var(--ember)"
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
