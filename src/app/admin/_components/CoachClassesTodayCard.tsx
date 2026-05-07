import Link from "next/link";
import KCard from "@/components/kronos/KCard";
import type { CoachClassToday } from "@/server/actions/coach-dashboard";

type Props = {
  classes: CoachClassToday[];
};

function formatTime(d: Date): string {
  return d.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fillRatio(booked: number, capacity: number): string {
  if (capacity === 0) return "—";
  const pct = Math.round((booked / capacity) * 100);
  return `${pct}%`;
}

export function CoachClassesTodayCard({ classes }: Props) {
  return (
    <KCard animate={false} className="p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="font-display text-xl font-bold">Tus clases hoy</h2>
        <Link
          href="/admin/programacion"
          className="text-sm text-[var(--strain)] hover:underline"
        >
          Ver semana →
        </Link>
      </div>

      {classes.length === 0 ? (
        <div className="py-2">
          <p className="text-sm text-[var(--text-2)]">
            No tenés clases asignadas hoy.
          </p>
          <p className="text-xs text-[var(--text-3)] mt-1">
            Revisá la programación si esperabas alguna.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {classes.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--card-2)]/40 hover:bg-[var(--card-2)]/70 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">
                  <span style={{ color: "var(--strain)" }}>
                    {formatTime(c.startsAt)}
                  </span>
                  {c.wodName ? (
                    <span className="ml-2 text-[var(--text)]">{c.wodName}</span>
                  ) : null}
                </p>
                <p className="text-xs text-[var(--text-3)] mt-0.5">
                  {c.durationMin} min · {c.attendedCount}/{c.bookedCount}{" "}
                  asistidos
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="k-chip k-chip-strain">
                  {c.bookedCount}/{c.capacity}
                </span>
                <p className="text-xs text-[var(--text-3)] mt-1">
                  {fillRatio(c.bookedCount, c.capacity)} lleno
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </KCard>
  );
}
