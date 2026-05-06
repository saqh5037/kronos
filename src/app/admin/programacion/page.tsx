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
import Eyebrow from "@/components/kronos/Eyebrow";

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
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Eyebrow>Operación</Eyebrow>
          <h1 className="k-h-italic font-display font-extrabold text-3xl lg:text-[38px] leading-[1] tracking-[-0.02em] mt-2">
            Programa<em>ción</em>
          </h1>
          <p
            className="text-sm mt-1 font-medium"
            style={{ color: "var(--text-2)" }}
          >
            Semana del {formatDayMonth(weekStart)} al{" "}
            {formatDayMonth(addDays(weekStart, 6))}
          </p>
        </div>
        <ClassForm coaches={coaches} wods={wods} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {Array.from(byDay.entries()).map(([dateKey, dayClasses]) => {
          const date = new Date(dateKey + "T12:00:00.000Z");
          const isToday = dateKey === today.toISOString().slice(0, 10);
          return (
            <div
              key={dateKey}
              className={`k-card flex flex-col overflow-hidden ${isToday ? "ring-1 ring-cyan/30" : ""}`}
            >
              <div
                className="px-2.5 py-2 border-b flex items-center justify-between"
                style={{ borderColor: "var(--line)" }}
              >
                <div className="flex items-center gap-2">
                  <p
                    className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase"
                    style={{ color: isToday ? "var(--cyan)" : "var(--text-3)" }}
                  >
                    {formatWeekday(date)}
                  </p>
                  <p className="font-display font-bold text-base leading-none">
                    {date.getUTCDate()}
                  </p>
                </div>
                {isToday && (
                  <span className="k-chip k-chip-cyan text-[8px] py-0.5 px-1.5">
                    HOY
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5 p-1.5 flex-1">
                {dayClasses.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-4">
                    <p
                      className="text-[11px] font-medium"
                      style={{ color: "var(--text-3)" }}
                    >
                      Sin clases
                    </p>
                  </div>
                ) : (
                  dayClasses.map((c) => <ClassCard key={c.id} c={c} />)
                )}
              </div>
            </div>
          );
        })}
      </div>

      {classes.length === 0 && (
        <div className="mt-6 k-card p-6 text-center">
          <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
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
      ? "k-chip-red"
      : fillRatio >= 0.7
        ? "k-chip-steel"
        : "k-chip-moss";

  return (
    <div
      className="rounded-xl border p-2 relative overflow-hidden group transition-all hover:border-[var(--line-strong)] hover:shadow-sm"
      style={{ background: "var(--card-2)", borderColor: "var(--line)" }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-[2.5px]"
        style={{
          background:
            fillRatio >= 1
              ? "var(--red)"
              : fillRatio >= 0.7
                ? "var(--steel)"
                : "var(--moss)",
        }}
      />
      <div className="pl-2">
        <div className="flex items-center justify-between gap-1">
          <div className="font-mono text-[10px] font-bold tracking-wide">
            {formatTime(c.startsAt)}
          </div>
          <span
            className={`k-chip ${chipClass}`}
            style={{ padding: "2px 7px", fontSize: 8 }}
          >
            {c.bookingCount}/{c.capacity}
          </span>
        </div>
        {c.wod && (
          <p
            className="text-[11px] mt-1 font-semibold truncate leading-tight"
            title={c.wod.name}
          >
            {c.wod.name}
          </p>
        )}
        {c.coach && (
          <p
            className="text-[10px] mt-0.5 truncate font-medium"
            style={{ color: "var(--text-3)" }}
          >
            {c.coach.name ?? "Coach"}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-1.5">
          <div
            className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ background: "var(--btn-ghost-bg)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, fillRatio * 100)}%`,
                background:
                  fillRatio >= 1
                    ? "var(--red)"
                    : fillRatio >= 0.7
                      ? "var(--steel)"
                      : "var(--moss)",
              }}
            />
          </div>
        </div>
        <div className="mt-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <CancelClassButton id={c.id} />
        </div>
      </div>
    </div>
  );
}
