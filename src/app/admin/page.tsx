import Link from "next/link";
import { getDashboardData } from "@/server/actions/dashboard";
import { getBox } from "@/server/actions/box";
import { getRevenueByDay } from "@/server/actions/payments";
import {
  getAttendanceByDay,
  type AttendanceByDayPoint,
} from "@/server/actions/attendance";
import type { RevenueByDayPoint } from "@/server/actions/payments";
import { rangeFromParams, previousRange, formatRange } from "@/lib/dates";
import { MetricDelta } from "@/components/charts/MetricDelta";
import Sparkline from "@/components/kronos/Sparkline";
import CountUp from "@/components/kronos/CountUp";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import KCard from "@/components/kronos/KCard";
import { DashboardFilters } from "./_components/DashboardFilters";
import { RevenueArea, AttendanceArea } from "./_components/DashboardCharts";

export const metadata = { title: "Kronos — Dashboard" };

type SearchParams = {
  preset?: string;
  from?: string;
  to?: string;
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const range = rangeFromParams({
    preset: sp.preset ?? "last30",
    from: sp.from,
    to: sp.to,
  });
  const prev = previousRange(range);

  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null;
  let box: Awaited<ReturnType<typeof getBox>> | null = null;
  let revenuePoints: RevenueByDayPoint[] = [];
  let revenuePrev: RevenueByDayPoint[] = [];
  let attendancePoints: AttendanceByDayPoint[] = [];
  let attendancePrev: AttendanceByDayPoint[] = [];

  try {
    [data, box, revenuePoints, revenuePrev, attendancePoints, attendancePrev] =
      await Promise.all([
        getDashboardData(),
        getBox(),
        getRevenueByDay({ dateFrom: range.from, dateTo: range.to }),
        getRevenueByDay({ dateFrom: prev.from, dateTo: prev.to }),
        getAttendanceByDay({ dateFrom: range.from, dateTo: range.to }),
        getAttendanceByDay({ dateFrom: prev.from, dateTo: prev.to }),
      ]);
  } catch {
    // BD/sesión ausente — fallback en render
  }

  if (!data || !box) {
    return (
      <div className="p-8">
        <p className="k-eyebrow mb-2">Dashboard</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Panel de control
        </h1>
        <p className="mt-4 text-sm" style={{ color: "var(--text-2)" }}>
          No se pudo cargar el dashboard. Verifica conexión con la BD.
        </p>
      </div>
    );
  }

  const fmtMoney = new Intl.NumberFormat(box.locale, {
    style: "currency",
    currency: box.currency,
    maximumFractionDigits: 0,
  });
  const fmtDate = new Intl.DateTimeFormat(box.locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: box.timezone,
  });
  const fmtTime = new Intl.DateTimeFormat(box.locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: box.timezone,
  });

  // Range KPIs
  const rangeRevenue = revenuePoints.reduce((s, p) => s + p.revenue, 0);
  const rangeRevenuePrev = revenuePrev.reduce((s, p) => s + p.revenue, 0);
  const rangeAttended = attendancePoints.reduce((s, p) => s + p.attended, 0);
  const rangeAttendedPrev = attendancePrev.reduce((s, p) => s + p.attended, 0);
  const rangeNoShow = attendancePoints.reduce((s, p) => s + p.noShow, 0);
  const rangeCompleted = rangeAttended + rangeNoShow;
  const rangeAttendanceRate =
    rangeCompleted === 0 ? 0 : rangeAttended / rangeCompleted;
  const prevCompleted =
    attendancePrev.reduce((s, p) => s + p.attended, 0) +
    attendancePrev.reduce((s, p) => s + p.noShow, 0);
  const prevAttendanceRate =
    prevCompleted === 0
      ? 0
      : attendancePrev.reduce((s, p) => s + p.attended, 0) / prevCompleted;

  // Sparkline data: last 14 days
  const last14 = revenuePoints.slice(-14);
  const last14Attended = attendancePoints.slice(-14);

  const expiringCount = data.expiringMemberships.length;
  const waitlistCount = data.waitlistedClassesToday;
  const allClear = expiringCount === 0 && waitlistCount === 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-8">
      <AnimatedSection>
        <AnimatedItem>
          <p className="k-eyebrow mb-2">Hoy</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {box.name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
            {fmtDate.format(new Date())} · {formatRange(range)}
          </p>
        </AnimatedItem>
      </AnimatedSection>

      <DashboardFilters />

      {/* Hero KPIs con MetricDelta + sparkline */}
      <div className="k-stagger grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiWithSpark
          label="Ingresos rango"
          value={fmtMoney.format(rangeRevenue)}
          numericValue={rangeRevenue}
          countMoney
          tone="moss"
          delta={
            <MetricDelta
              current={rangeRevenue}
              previous={rangeRevenuePrev}
              goodWhen="higher"
              formatter={(v) => fmtMoney.format(v)}
            />
          }
          sparkValues={last14.map((p) => p.revenue)}
          sparkColor="var(--moss)"
        />
        <KpiWithSpark
          label="Asistencias rango"
          value={String(rangeAttended)}
          numericValue={rangeAttended}
          tone="steel"
          delta={
            <MetricDelta
              current={rangeAttended}
              previous={rangeAttendedPrev}
              goodWhen="higher"
              formatter={(v) => v.toFixed(0)}
            />
          }
          sparkValues={last14Attended.map((p) => p.attended)}
          sparkColor="var(--steel)"
        />
        <KpiWithSpark
          label="Tasa asistencia"
          value={`${Math.round(rangeAttendanceRate * 100)}%`}
          numericValue={Math.round(rangeAttendanceRate * 100)}
          countSuffix="%"
          tone={
            rangeAttendanceRate >= 0.85
              ? "moss"
              : rangeAttendanceRate >= 0.65
                ? "steel"
                : "ember"
          }
          delta={
            <MetricDelta
              current={rangeAttendanceRate}
              previous={prevAttendanceRate}
              goodWhen="higher"
              formatter={(v) => `${(v * 100).toFixed(1)}%`}
            />
          }
        />
        <KpiWithSpark
          label="Hoy"
          value={`${data.todayStats.totalClasses} clases`}
          subtitle={`${data.todayStats.totalAttended}/${data.todayStats.totalBooked} asistidos · ${fmtMoney.format(data.todayRevenue)}`}
        />
      </div>

      {/* Charts */}
      <div className="k-stagger grid grid-cols-1 gap-3 lg:grid-cols-2">
        <KCard>
          <div className="p-4">
            <p className="k-eyebrow mb-2">Ingresos · {formatRange(range)}</p>
            {revenuePoints.some((p) => p.revenue > 0) ? (
              <RevenueArea data={revenuePoints} />
            ) : (
              <p className="py-10 text-center text-sm text-[var(--text-3)]">
                Sin pagos en el rango
              </p>
            )}
          </div>
        </KCard>
        <KCard>
          <div className="p-4">
            <p className="k-eyebrow mb-2">Asistencias · {formatRange(range)}</p>
            {attendancePoints.some((p) => p.attended > 0) ? (
              <AttendanceArea data={attendancePoints} />
            ) : (
              <p className="py-10 text-center text-sm text-[var(--text-3)]">
                Sin actividad en el rango
              </p>
            )}
          </div>
        </KCard>
      </div>

      {/* Próximas clases + Alerts */}
      <AnimatedSection className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AnimatedItem>
          <KCard>
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="k-eyebrow">Próximas clases</p>
                <Link
                  href="/admin/programacion"
                  className="text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ color: "var(--steel)" }}
                >
                  Ver todas →
                </Link>
              </div>
              {data.nextClasses.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-3)" }}>
                  No hay clases en las próximas 48 horas.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.nextClasses.map((c) => {
                    const occupied = c.bookedCount;
                    const capacity = c.capacity;
                    const isFull = occupied >= capacity;
                    const hasWaitlist = c.waitlistCount > 0;
                    const fillRatio = occupied / capacity;
                    const barColor = isFull
                      ? "var(--ember)"
                      : fillRatio >= 0.7
                        ? "var(--steel)"
                        : "var(--moss)";

                    return (
                      <li
                        key={c.id}
                        className="k-card flex items-center justify-between p-3"
                      >
                        <div className="mr-3 flex min-w-0 flex-1 flex-col gap-0.5">
                          <p className="text-sm font-semibold">
                            {fmtTime.format(c.startsAt)} ·{" "}
                            {c.wod?.name ?? "Sin WOD"}
                          </p>
                          <p
                            className="truncate text-xs"
                            style={{ color: "var(--text-3)" }}
                          >
                            {c.coach?.name ?? "Sin coach"}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <div
                              className="h-1.5 flex-1 overflow-hidden rounded-full"
                              style={{ background: "var(--btn-ghost-bg)" }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, fillRatio * 100)}%`,
                                  background: barColor,
                                  boxShadow:
                                    fillRatio > 0.6
                                      ? `0 0 6px ${barColor}`
                                      : "none",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <span
                          className={
                            isFull
                              ? "k-chip k-chip-pr"
                              : hasWaitlist
                                ? "k-chip k-chip-strain"
                                : "k-chip k-chip-ghost"
                          }
                        >
                          {occupied}/{capacity}
                          {hasWaitlist ? ` · +${c.waitlistCount}` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </KCard>
        </AnimatedItem>

        <AnimatedItem>
          <KCard>
            <div className="p-5">
              <p className="k-eyebrow mb-4">Alertas</p>
              {allClear ? (
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--recovery-soft)",
                    border: "1px solid var(--recovery-line)",
                  }}
                >
                  <p
                    className="flex items-center gap-2 text-sm font-bold"
                    style={{ color: "var(--moss)" }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Todo en orden hoy
                  </p>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--text-3)" }}
                  >
                    Sin membresías por vencer ni waitlists activas.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {expiringCount > 0 && (
                    <li>
                      <Link
                        href="/admin/pagos"
                        className="k-card hover:border-ember/50 flex items-center justify-between p-3 transition-colors"
                        style={{ borderColor: "var(--line)" }}
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {expiringCount} membresía
                            {expiringCount === 1 ? "" : "s"} por vencer
                          </p>
                          <p
                            className="mt-0.5 text-xs"
                            style={{ color: "var(--text-3)" }}
                          >
                            Próximos 7 días
                          </p>
                        </div>
                        <span className="k-chip k-chip-pr">
                          {expiringCount}
                        </span>
                      </Link>
                    </li>
                  )}
                  {waitlistCount > 0 && (
                    <li>
                      <Link
                        href="/admin/reservas"
                        className="k-card hover:border-steel/50 flex items-center justify-between p-3 transition-colors"
                        style={{ borderColor: "var(--line)" }}
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {waitlistCount} clase
                            {waitlistCount === 1 ? "" : "s"} con waitlist hoy
                          </p>
                          <p
                            className="mt-0.5 text-xs"
                            style={{ color: "var(--text-3)" }}
                          >
                            Revisa promociones disponibles
                          </p>
                        </div>
                        <span className="k-chip k-chip-strain">
                          {waitlistCount}
                        </span>
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </KCard>
        </AnimatedItem>
      </AnimatedSection>

      {/* Quick links */}
      <AnimatedSection>
        <AnimatedItem>
          <p className="k-eyebrow mb-3">Accesos rápidos</p>
        </AnimatedItem>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickLink href="/admin/programacion" label="Crear clase" />
          <QuickLink href="/admin/atletas" label="Atletas" />
          <QuickLink href="/admin/pagos" label="Pagos" />
          <QuickLink href="/admin/reportes" label="Reportes" />
        </div>
      </AnimatedSection>
    </div>
  );
}

function KpiWithSpark({
  label,
  value,
  numericValue,
  countMoney,
  countSuffix,
  countDecimals,
  subtitle,
  tone,
  delta,
  sparkValues,
  sparkColor,
}: {
  label: string;
  value: string;
  numericValue?: number;
  countMoney?: boolean;
  countSuffix?: string;
  countDecimals?: number;
  subtitle?: string;
  tone?: "moss" | "steel" | "ember";
  delta?: React.ReactNode;
  sparkValues?: number[];
  sparkColor?: string;
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
        {typeof numericValue === "number" ? (
          <CountUp
            value={numericValue}
            money={countMoney}
            suffix={countSuffix}
            decimals={countDecimals}
            duration={1000}
          />
        ) : (
          value
        )}
      </p>
      {subtitle ? (
        <p className="mt-1 text-xs text-[var(--text-3)]">{subtitle}</p>
      ) : null}
      {sparkValues && sparkValues.length >= 2 ? (
        <div className="mt-2">
          <Sparkline
            values={sparkValues}
            color={sparkColor ?? "var(--steel)"}
            height={28}
            width={140}
          />
        </div>
      ) : null}
    </div>
  );
}

type LinkHref = React.ComponentProps<typeof Link>["href"];

function QuickLink({ href, label }: { href: LinkHref; label: string }) {
  return (
    <Link href={href}>
      <KCard
        variant="ghost"
        className="hover:border-moss/50 p-4 text-center transition-colors"
      >
        <p className="text-sm font-semibold">{label}</p>
      </KCard>
    </Link>
  );
}
