import { ClassCard } from "./ClassCard";
import type { ClassRow } from "@/server/actions/classes";
import { EmptyState } from "@/components/kronos/EmptyState";

const HOUR_HEIGHT = 56;
const START_HOUR = 5;
const END_HOUR = 22;

export function DayView({
  date,
  classes,
}: {
  date: Date;
  classes: ClassRow[];
}) {
  const sorted = [...classes].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  );

  const totalCapacity = sorted.reduce((s, c) => s + c.capacity, 0);
  const totalBooked = sorted.reduce((s, c) => s + c.bookingCount, 0);
  const fillPct = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;

  return (
    <div className="k-card p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div>
            <p
              className="font-mono text-[10px] tracking-[0.12em] uppercase font-bold"
              style={{ color: "var(--text-3)" }}
            >
              CLASES
            </p>
            <p className="font-display text-2xl font-bold leading-none mt-1">
              {sorted.length}
            </p>
          </div>
          <div>
            <p
              className="font-mono text-[10px] tracking-[0.12em] uppercase font-bold"
              style={{ color: "var(--text-3)" }}
            >
              RESERVAS
            </p>
            <p className="font-display text-2xl font-bold leading-none mt-1">
              {totalBooked}/{totalCapacity}
            </p>
          </div>
          <div>
            <p
              className="font-mono text-[10px] tracking-[0.12em] uppercase font-bold"
              style={{ color: "var(--text-3)" }}
            >
              OCUPACIÓN
            </p>
            <p
              className="font-display text-2xl font-bold leading-none mt-1"
              style={{
                color:
                  fillPct >= 80
                    ? "var(--red)"
                    : fillPct >= 50
                      ? "var(--moss)"
                      : "var(--text)",
              }}
            >
              {Math.round(fillPct)}%
            </p>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          tone="neutral"
          title={`Sin clases el ${date.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}`}
          description="Si este día no opera, configúralo en Ajustes › Horarios. Si querés agregar una clase puntual, usá ‘+ Nueva clase’."
        />
      ) : (
        <div className="relative grid grid-cols-[60px_1fr] gap-3">
          <div className="flex flex-col">
            {hours.map((h) => (
              <div
                key={h}
                className="font-mono text-[10px] font-bold tracking-wide flex items-start justify-end pr-2"
                style={{
                  color: "var(--text-3)",
                  height: HOUR_HEIGHT,
                }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          <div
            className="relative"
            style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }}
          >
            {hours.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t"
                style={{
                  borderColor: "var(--line)",
                  top: (h - START_HOUR) * HOUR_HEIGHT,
                }}
              />
            ))}
            {sorted.map((c) => {
              const start = c.startsAt;
              const hourOffset =
                start.getHours() + start.getMinutes() / 60 - START_HOUR;
              const top = hourOffset * HOUR_HEIGHT;
              const height = Math.max(
                40,
                (c.durationMin / 60) * HOUR_HEIGHT - 4,
              );
              return (
                <div
                  key={c.id}
                  className="absolute left-0 right-0 px-1"
                  style={{ top, height }}
                >
                  <ClassCard c={c} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
