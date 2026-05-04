import Link from "next/link";
import { getDashboardData } from "@/server/actions/dashboard";
import { getBox } from "@/server/actions/box";
import { KPI } from "@/components/kronos/StatCard";

export const metadata = { title: "Kronos — Dashboard" };

export default async function AdminDashboardPage() {
  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null;
  let box: Awaited<ReturnType<typeof getBox>> | null = null;
  try {
    [data, box] = await Promise.all([getDashboardData(), getBox()]);
  } catch {
    // BD/sesión ausente — fallback en render
  }

  if (!data || !box) {
    return (
      <div className="p-8">
        <p className="k-eyebrow mb-2">Dashboard</p>
        <h1 className="font-display font-bold text-3xl tracking-tight">
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

  const attendanceRatePct = Math.round(data.todayStats.attendanceRate * 100);
  const expiringCount = data.expiringMemberships.length;
  const waitlistCount = data.waitlistedClassesToday;
  const allClear = expiringCount === 0 && waitlistCount === 0;

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <p className="k-eyebrow mb-2">Hoy</p>
        <h1 className="font-display font-bold text-3xl tracking-tight">
          {box.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
          {fmtDate.format(new Date())} ·{" "}
          {data.todayStats.totalClasses === 0
            ? "Sin clases programadas"
            : `${data.todayStats.totalClasses} clases hoy`}
        </p>
      </div>

      {/* Hero KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KPI
          label="Clases hoy"
          value={String(data.todayStats.totalClasses)}
          subtitle={`${data.todayStats.totalBooked} reservas`}
          tone="strain"
        />
        <KPI
          label="Asistencia"
          value={`${attendanceRatePct}%`}
          subtitle={`${data.todayStats.totalAttended} de ${data.todayStats.totalBooked}`}
          tone="recovery"
        />
        <KPI
          label="Ingreso del día"
          value={fmtMoney.format(data.todayRevenue)}
          subtitle={`${data.todayPaymentsCount} pagos`}
          tone="recovery"
        />
      </section>

      {/* Próximas clases + Alerts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas clases */}
        <div className="k-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="k-eyebrow">Próximas clases</p>
            <Link
              href="/admin/programacion"
              className="text-xs"
              style={{ color: "var(--strain)" }}
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
                return (
                  <li
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <p className="text-sm font-semibold">
                        {fmtTime.format(c.startsAt)} ·{" "}
                        {c.wod?.name ?? "Sin WOD"}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--text-3)" }}
                      >
                        {c.coach?.name ?? "Sin coach"}
                      </p>
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

        {/* Alerts */}
        <div className="k-card p-5">
          <p className="k-eyebrow mb-4">Alertas</p>
          {allClear ? (
            <div
              className="p-4 rounded-lg"
              style={{
                background: "rgba(25, 240, 139, 0.08)",
                border: "1px solid rgba(25, 240, 139, 0.2)",
              }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--recovery)" }}
              >
                Todo en orden hoy
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                Sin membresías por vencer ni waitlists activas.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {expiringCount > 0 && (
                <li>
                  <Link
                    href="/admin/pagos"
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-pr/50 transition-colors"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {expiringCount} membresía
                        {expiringCount === 1 ? "" : "s"} por vencer
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-3)" }}
                      >
                        Próximos 7 días
                      </p>
                    </div>
                    <span className="k-chip k-chip-pr">{expiringCount}</span>
                  </Link>
                </li>
              )}
              {waitlistCount > 0 && (
                <li>
                  <Link
                    href="/admin/reservas"
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-strain/50 transition-colors"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {waitlistCount} clase
                        {waitlistCount === 1 ? "" : "s"} con waitlist hoy
                      </p>
                      <p
                        className="text-xs mt-0.5"
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
      </section>

      {/* Quick links */}
      <section>
        <p className="k-eyebrow mb-3">Accesos rápidos</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickLink href="/admin/programacion" label="Crear clase" />
          <QuickLink href="/admin/atletas" label="Nuevo atleta" />
          <QuickLink href="/admin/wods" label="WODs" />
          <QuickLink href="/admin/reportes" label="Ver reportes" />
        </div>
      </section>
    </div>
  );
}

type LinkHref = React.ComponentProps<typeof Link>["href"];

function QuickLink({ href, label }: { href: LinkHref; label: string }) {
  return (
    <Link
      href={href}
      className="p-4 rounded-xl border text-center hover:border-recovery/50 transition-colors"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <p className="text-sm font-semibold">{label}</p>
    </Link>
  );
}
