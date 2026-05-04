import {
  listAvailableClasses,
  type AvailableClass,
} from "@/server/actions/bookings";
import { BookButton } from "@/components/BookingActions";
import { formatDayMonth, formatTime } from "@/lib/week";

export const metadata = { title: "Kronos — Reservar" };

export default async function ReservarPage() {
  let classes: AvailableClass[] = [];
  try {
    classes = await listAvailableClasses(7);
  } catch {
    // Sesión ausente
  }

  const myActive = classes.filter(
    (c) => c.myBookingStatus === "BOOKED" || c.myBookingStatus === "WAITLIST",
  );

  // Group classes by date
  const byDay = new Map<string, AvailableClass[]>();
  for (const c of classes) {
    const key = c.startsAt.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(c);
  }

  return (
    <div className="p-4 pt-16 pb-24">
      <p className="k-eyebrow mb-1">Reservas</p>
      <h1 className="font-display font-bold text-3xl">Próximas clases</h1>

      {myActive.length > 0 && (
        <section className="mt-6">
          <p className="k-eyebrow mb-2" style={{ color: "var(--recovery)" }}>
            Tus reservas activas
          </p>
          <div className="flex flex-col gap-2">
            {myActive.map((c) => (
              <ClassRow key={`mine-${c.id}`} c={c} highlight />
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <p className="k-eyebrow mb-2" style={{ color: "var(--text-2)" }}>
          Próximos 7 días
        </p>

        {classes.length === 0 ? (
          <div
            className="p-6 rounded-xl border text-center"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              No hay clases programadas. Vuelve pronto.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Array.from(byDay.entries()).map(([dateKey, dayClasses]) => {
              const date = new Date(dateKey + "T12:00:00.000Z");
              return (
                <div key={dateKey} className="flex flex-col gap-2">
                  <p
                    className="font-display font-semibold text-sm"
                    style={{ color: "var(--text-2)" }}
                  >
                    {formatDayMonth(date)}
                  </p>
                  {dayClasses.map((c) => (
                    <ClassRow key={c.id} c={c} />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ClassRow({
  c,
  highlight = false,
}: {
  c: AvailableClass;
  highlight?: boolean;
}) {
  const full = c.bookedCount >= c.capacity;
  const fillRatio = c.bookedCount / c.capacity;
  const chip =
    fillRatio >= 1
      ? "k-chip-pr"
      : fillRatio >= 0.7
        ? "k-chip-strain"
        : "k-chip-recovery";

  return (
    <div
      className="p-3 rounded-xl border flex items-center gap-3"
      style={{
        borderColor: highlight ? "var(--recovery)" : "var(--line)",
        background: "var(--card)",
      }}
    >
      <div className="flex flex-col items-center justify-center min-w-[3rem]">
        <p className="font-mono text-sm font-semibold">
          {formatTime(c.startsAt)}
        </p>
        <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
          {c.durationMin}min
        </p>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-sm truncate">
          {c.wod?.name ?? "WOD por definir"}
        </p>
        <div
          className="flex items-center gap-2 text-[10px] mt-0.5"
          style={{ color: "var(--text-3)" }}
        >
          {c.coach?.name && <span>{c.coach.name}</span>}
          {c.wod && (
            <>
              <span>·</span>
              <span>{c.wod.type}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className={`k-chip ${chip} text-[10px]`}>
          {c.bookedCount}/{c.capacity}
        </span>
        {c.myBookingStatus === "WAITLIST" && (
          <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
            En waitlist
          </span>
        )}
        {full && c.myBookingStatus === null && (
          <span className="text-[10px]" style={{ color: "var(--pr)" }}>
            Lleno
          </span>
        )}
      </div>

      <BookButton
        classId={c.id}
        bookedCount={c.bookedCount}
        capacity={c.capacity}
        myStatus={c.myBookingStatus}
        myBookingId={c.myBookingId}
      />
    </div>
  );
}
