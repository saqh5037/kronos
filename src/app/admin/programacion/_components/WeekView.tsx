import { ClassCard } from "./ClassCard";
import { addDays, formatWeekday } from "@/lib/week";
import type { ClassRow } from "@/server/actions/classes";
import { EmptyState } from "@/components/kronos/EmptyState";
import { dayKeyLocal, sortClassesByStart } from "../../_lib/schedule";

export function WeekView({
  weekStart,
  classes,
  today,
}: {
  weekStart: Date;
  classes: ClassRow[];
  today: Date;
}) {
  // Local day keys, not the UTC slice of an ISO string: 18:00 in Mexico City
  // is already the next day in UTC, which is what pushed evening classes into
  // the following column (audit /admin/programacion P1).
  const todayKey = dayKeyLocal(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {days.map((d) => {
          const key = dayKeyLocal(d);
          const dayClasses = sortClassesByStart(
            classes.filter((c) => dayKeyLocal(c.startsAt) === key),
          );
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className="k-card flex flex-col overflow-hidden"
              style={
                isToday
                  ? { boxShadow: "inset 0 0 0 1px var(--k-accent-line)" }
                  : undefined
              }
            >
              <div
                className="px-2.5 py-2 border-b flex items-center justify-between"
                style={{ borderColor: "var(--k-line)" }}
              >
                <div className="flex items-center gap-2">
                  <p
                    className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase"
                    style={{
                      color: isToday ? "var(--k-accent)" : "var(--k-t2)",
                    }}
                  >
                    {formatWeekday(d)}
                  </p>
                  <p className="font-display font-bold text-base leading-none">
                    {d.getDate()}
                  </p>
                </div>
                {isToday && (
                  <span className="k-chip k-chip-moss text-[8px] py-0.5 px-1.5">
                    HOY
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5 p-1.5 flex-1">
                {dayClasses.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-4">
                    <p
                      className="text-[11px] font-medium"
                      style={{ color: "var(--k-t2)" }}
                    >
                      Sin clases
                    </p>
                  </div>
                ) : (
                  dayClasses.map((c) => <ClassCard key={c.id} c={c} compact />)
                )}
              </div>
            </div>
          );
        })}
      </div>

      {classes.length === 0 && (
        <div className="mt-6">
          <EmptyState
            tone="info"
            title="Sin clases programadas esta semana"
            description="Crea tu primera clase con el botón ‘+ Nueva clase’ o configura horarios operativos en Ajustes › Horarios."
          />
        </div>
      )}
    </>
  );
}
