import { listClassesInRange, type ClassRow } from "@/server/actions/classes";
import { getClassRoster, type ClassRoster } from "@/server/actions/bookings";
import {
  CheckInButton,
  NoShowButton,
  CancelBookingButton,
} from "@/components/BookingActions";
import { addDays, formatTime, formatDayMonth } from "@/lib/week";

export const metadata = { title: "Kronos — Reservas" };

export default async function ReservasPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = addDays(today, 7);

  let classes: ClassRow[] = [];
  let rosters: ClassRoster[] = [];

  try {
    classes = await listClassesInRange(today, horizon);
    rosters = await Promise.all(classes.map((c) => getClassRoster(c.id)));
  } catch {
    // BD/sesión ausentes
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="k-eyebrow mb-1">Operación</p>
        <h1 className="font-display font-bold text-3xl tracking-tight">
          Reservas
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
          Roster de clases de los próximos 7 días — check-in, waitlist,
          cancelaciones
        </p>
      </div>

      {classes.length === 0 ? (
        <div
          className="p-6 rounded-xl border text-center"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            No hay clases programadas en los próximos 7 días.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rosters.map((roster) => (
            <RosterCard key={roster.classId} roster={roster} />
          ))}
        </div>
      )}
    </div>
  );
}

function RosterCard({ roster }: { roster: ClassRoster }) {
  const booked = roster.bookings.filter(
    (b) => b.status === "BOOKED" || b.status === "ATTENDED",
  );
  const waitlist = roster.bookings.filter((b) => b.status === "WAITLIST");
  const fillRatio = booked.length / roster.capacity;
  const chip =
    fillRatio >= 1
      ? "k-chip-pr"
      : fillRatio >= 0.7
        ? "k-chip-strain"
        : "k-chip-recovery";

  return (
    <div
      className="rounded-xl border"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <div
        className="p-4 border-b flex items-center justify-between gap-4 flex-wrap"
        style={{ borderColor: "var(--line)" }}
      >
        <div>
          <p className="k-eyebrow" style={{ color: "var(--text-2)" }}>
            {formatDayMonth(roster.startsAt)} · {formatTime(roster.startsAt)}
          </p>
          <h3 className="font-display font-bold text-lg mt-0.5">
            {roster.wodName ?? "Sin WOD asignado"}
          </h3>
          {roster.coachName && (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              Coach: {roster.coachName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`k-chip ${chip}`}>
            {booked.length}/{roster.capacity}
          </span>
          {waitlist.length > 0 && (
            <span className="k-chip k-chip-ghost">
              +{waitlist.length} waitlist
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {roster.bookings.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            Sin reservas todavía.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--line)",
                  color: "var(--text-3)",
                }}
              >
                <th className="text-left pb-2 k-eyebrow">Atleta</th>
                <th className="text-left pb-2 k-eyebrow">Estado</th>
                <th className="text-left pb-2 k-eyebrow">Reservó</th>
                <th className="text-right pb-2 k-eyebrow">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roster.bookings.map((b) => (
                <tr
                  key={b.bookingId}
                  style={{ borderBottom: "1px solid var(--line)" }}
                >
                  <td className="py-2 font-medium">
                    {b.firstName} {b.lastName}
                  </td>
                  <td className="py-2">
                    <span className={`k-chip ${chipForStatus(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td
                    className="py-2 font-mono text-xs"
                    style={{ color: "var(--text-3)" }}
                  >
                    {formatTime(b.bookedAt)}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center justify-end gap-2">
                      {b.status === "BOOKED" && (
                        <>
                          <CheckInButton bookingId={b.bookingId} />
                          <NoShowButton bookingId={b.bookingId} />
                          <CancelBookingButton bookingId={b.bookingId} />
                        </>
                      )}
                      {b.status === "WAITLIST" && (
                        <CancelBookingButton bookingId={b.bookingId} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
