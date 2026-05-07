import { ClassCard } from "./ClassCard";
import { addDays, formatWeekday } from "@/lib/week";
import type { ClassRow } from "@/server/actions/classes";
import { EmptyState } from "@/components/kronos/EmptyState";

export function WeekView({
  weekStart,
  classes,
  today,
}: {
  weekStart: Date;
  classes: ClassRow[];
  today: Date;
}) {
  const todayKey = today.toISOString().slice(0, 10);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {days.map((d) => {
          const key = d.toISOString().slice(0, 10);
          const dayClasses = classes
            .filter((c) => c.startsAt.toISOString().slice(0, 10) === key)
            .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className={`k-card flex flex-col overflow-hidden ${isToday ? "ring-1 ring-cyan/30" : ""}`}
            >
              <div
                className="px-2.5 py-2 border-b flex items-center justify-between"
                style={{ borderColor: "var(--k-line)" }}
              >
                <div className="flex items-center gap-2">
                  <p
                    className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase"
                    style={{
                      color: isToday ? "var(--k-warning)" : "var(--k-t3)",
                    }}
                  >
                    {formatWeekday(d)}
                  </p>
                  <p className="font-display font-bold text-base leading-none">
                    {d.getDate()}
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
                      style={{ color: "var(--k-t3)" }}
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
