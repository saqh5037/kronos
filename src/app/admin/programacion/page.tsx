import {
  listClassesInRange,
  listCoaches,
  listWODs,
  type ClassRow,
} from "@/server/actions/classes";
import ClassForm from "@/components/ClassForm";
import CancelClassButton from "@/components/CancelClassButton";
import {
  startOfWeek,
  endOfWeek,
  addDays,
  formatWeekday,
  formatTime,
  formatDayMonth,
} from "@/lib/week";

export const metadata = { title: "Kronos — Programación" };

type Coach = { id: string; name: string | null; email: string };
type WOD = { id: string; name: string; type: string };

export default async function ProgramacionPage() {
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);

  let classes: ClassRow[] = [];
  let coaches: Coach[] = [];
  let wods: WOD[] = [];

  try {
    [classes, coaches, wods] = await Promise.all([
      listClassesInRange(weekStart, weekEnd),
      listCoaches(),
      listWODs(),
    ]);
  } catch {
    // BD ausente o sin sesión — render vacío
  }

  const byDay = new Map<string, ClassRow[]>();
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    byDay.set(day.toISOString().slice(0, 10), []);
  }
  for (const c of classes) {
    const key = c.startsAt.toISOString().slice(0, 10);
    if (byDay.has(key)) byDay.get(key)!.push(c);
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="k-eyebrow mb-1">Operación</p>
          <h1 className="font-display font-bold text-3xl tracking-tight">
            Programación
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            Semana del {formatDayMonth(weekStart)} al{" "}
            {formatDayMonth(addDays(weekStart, 6))}
          </p>
        </div>
        <ClassForm coaches={coaches} wods={wods} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {Array.from(byDay.entries()).map(([dateKey, dayClasses]) => {
          const date = new Date(dateKey + "T12:00:00.000Z");
          const isToday = dateKey === today.toISOString().slice(0, 10);
          return (
            <div
              key={dateKey}
              className="rounded-xl border flex flex-col"
              style={{
                borderColor: isToday ? "var(--strain)" : "var(--line)",
                background: "var(--card)",
                minHeight: "200px",
              }}
            >
              <div
                className="px-3 py-2 border-b"
                style={{ borderColor: "var(--line)" }}
              >
                <p
                  className="k-eyebrow"
                  style={{
                    color: isToday ? "var(--strain)" : "var(--text-2)",
                  }}
                >
                  {formatWeekday(date)}
                </p>
                <p className="font-display font-bold text-lg">
                  {date.getUTCDate()}
                </p>
              </div>

              <div className="flex flex-col gap-2 p-2 flex-1">
                {dayClasses.length === 0 ? (
                  <p
                    className="text-xs text-center mt-4"
                    style={{ color: "var(--text-3)" }}
                  >
                    —
                  </p>
                ) : (
                  dayClasses.map((c) => <ClassCard key={c.id} c={c} />)
                )}
              </div>
            </div>
          );
        })}
      </div>

      {classes.length === 0 && (
        <div
          className="mt-6 p-6 rounded-xl border text-center"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            No hay clases programadas esta semana. Crea la primera con el botón
            de arriba.
          </p>
        </div>
      )}
    </div>
  );
}

function ClassCard({ c }: { c: ClassRow }) {
  const fillRatio = c.bookingCount / c.capacity;
  const chipClass =
    fillRatio >= 1
      ? "k-chip-pr"
      : fillRatio >= 0.7
        ? "k-chip-strain"
        : "k-chip-recovery";

  return (
    <div
      className="rounded-lg p-2 border"
      style={{
        borderColor: "var(--line)",
        background: "var(--card-2)",
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="font-mono text-xs font-semibold">
          {formatTime(c.startsAt)}
        </div>
        <span className={`k-chip ${chipClass} text-[10px]`}>
          {c.bookingCount}/{c.capacity}
        </span>
      </div>
      {c.wod && (
        <p className="text-xs mt-1 truncate" title={c.wod.name}>
          {c.wod.name}
        </p>
      )}
      {c.coach && (
        <p
          className="text-[10px] mt-0.5 truncate"
          style={{ color: "var(--text-3)" }}
        >
          {c.coach.name ?? "Coach"}
        </p>
      )}
      <div className="mt-1 flex justify-end">
        <CancelClassButton id={c.id} />
      </div>
    </div>
  );
}
