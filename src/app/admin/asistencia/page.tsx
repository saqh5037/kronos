import {
  getTodayClasses,
  getTodayStats,
  type DayClass,
  type DayStats,
} from "@/server/actions/attendance";
import { getClassRoster, type ClassRoster } from "@/server/actions/bookings";
import { CheckInButton, NoShowButton } from "@/components/BookingActions";
import { formatTime } from "@/lib/week";

export const metadata = { title: "Kronos — Asistencia" };

export default async function AsistenciaPage() {
  let classes: DayClass[] = [];
  let stats: DayStats = {
    totalClasses: 0,
    totalBooked: 0,
    totalAttended: 0,
    totalNoShow: 0,
    attendanceRate: 0,
  };
  let rosters: ClassRoster[] = [];

  try {
    classes = await getTodayClasses();
    stats = await getTodayStats();
    rosters = await Promise.all(classes.map((c) => getClassRoster(c.id)));
  } catch {
    // BD/sesión ausentes
  }

  const today = new Date();
  const todayLabel = today.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="p-8">
      {/* HERO */}
      <div
        className="relative rounded-[18px] overflow-hidden mb-8 p-6"
        style={{
          background: "#101316",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 80% 0%, rgba(58,163,255,0.25), transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(25,240,139,0.18), transparent 60%)",
          }}
        />
        <div className="relative">
          <p className="k-eyebrow mb-2" style={{ color: "var(--text-2)" }}>
            Operación · Hoy
          </p>
          <h1 className="font-display font-bold text-4xl tracking-tight capitalize">
            {todayLabel}
          </h1>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label="Clases" value={String(stats.totalClasses)} />
        <Stat label="Reservados" value={String(stats.totalBooked)} />
        <Stat
          label="Asistidos"
          value={String(stats.totalAttended)}
          tone="recovery"
        />
        <Stat
          label="Tasa de asistencia"
          value={`${Math.round(stats.attendanceRate * 100)}%`}
          tone="strain"
        />
      </div>

      {classes.length === 0 ? (
        <div
          className="p-6 rounded-xl border text-center"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            No hay clases programadas para hoy.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rosters.map((roster) => (
            <DayRoster key={roster.classId} roster={roster} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "recovery" | "strain" | "pr";
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
    <div className="k-card p-4">
      <p className="k-eyebrow" style={{ color: "var(--text-2)" }}>
        {label}
      </p>
      <p className="font-display font-bold text-3xl mt-1" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function DayRoster({ roster }: { roster: ClassRoster }) {
  const booked = roster.bookings.filter(
    (b) => b.status === "BOOKED" || b.status === "ATTENDED",
  );
  const attended = roster.bookings.filter(
    (b) => b.status === "ATTENDED",
  ).length;

  return (
    <div className="k-card overflow-hidden">
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-center gap-3">
          <div className="font-display font-bold text-xl">
            {formatTime(roster.startsAt)}
          </div>
          <div>
            <p className="text-sm font-medium">{roster.wodName ?? "Sin WOD"}</p>
            {roster.coachName && (
              <p
                className="text-[10px] mt-0.5"
                style={{ color: "var(--text-3)" }}
              >
                {roster.coachName}
              </p>
            )}
          </div>
        </div>
        <div
          className="font-mono text-sm font-bold"
          style={{ color: "var(--recovery)" }}
        >
          {attended}/{booked.length}
        </div>
      </div>

      <div className="p-4">
        {roster.bookings.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            Sin reservas.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {roster.bookings.map((b) => (
              <li
                key={b.bookingId}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="font-medium">
                  {b.firstName} {b.lastName}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`k-chip ${chipForStatus(b.status)}`}>
                    {b.status}
                  </span>
                  {b.status === "BOOKED" && (
                    <>
                      <CheckInButton bookingId={b.bookingId} />
                      <NoShowButton bookingId={b.bookingId} />
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function chipForStatus(status: string): string {
  switch (status) {
    case "BOOKED":
      return "k-chip-strain";
    case "ATTENDED":
      return "k-chip-recovery";
    case "WAITLIST":
      return "k-chip-ghost";
    case "NOSHOW":
    case "CANCELLED":
      return "k-chip-pr";
    default:
      return "k-chip-ghost";
  }
}
