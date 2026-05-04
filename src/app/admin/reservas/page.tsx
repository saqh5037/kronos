import { listClassesInRange, type ClassRow } from "@/server/actions/classes";
import { getClassRoster, type ClassRoster } from "@/server/actions/bookings";
import CollapsibleRoster from "@/components/kronos/CollapsibleRoster";
import { addDays } from "@/lib/week";

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
      <div className="mb-8">
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
        <div className="flex flex-col gap-3">
          {rosters.map((roster) => (
            <CollapsibleRoster key={roster.classId} roster={roster} />
          ))}
        </div>
      )}
    </div>
  );
}
