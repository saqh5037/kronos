import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, ClipboardCheck, Camera } from "lucide-react";
import KCard from "@/components/kronos/KCard";
import type { CoachClassToday } from "@/server/actions/coach-dashboard";
import { formatTime24 } from "@/lib/format";
import {
  isFinished,
  pickNextClass,
  sortClassesByStart,
} from "../_lib/schedule";

type Props = {
  classes: CoachClassToday[];
  now?: Date;
};

function occupancy(booked: number, capacity: number): string {
  if (capacity === 0) return `${booked} reservados`;
  const pct = Math.round((booked / capacity) * 100);
  return `${booked}/${capacity} · ${pct} %`;
}

/**
 * Attendance only means something once the class has started: before that,
 * "0/4 asistidos" reads as a problem when it just means nobody arrived yet.
 */
function progressLabel(c: CoachClassToday, started: boolean): string {
  if (!started) {
    return `${c.bookedCount} reservado${c.bookedCount === 1 ? "" : "s"}`;
  }
  return `${c.attendedCount}/${c.bookedCount} asistidos`;
}

export function CoachClassesTodayCard({ classes, now = new Date() }: Props) {
  const sorted = sortClassesByStart(classes);
  const nextClass = pickNextClass(classes, now);

  return (
    <KCard animate={false} className="p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="font-display text-xl font-bold">Tus clases hoy</h2>
        <Link
          href="/admin/programacion"
          className="inline-flex items-center gap-1 text-sm text-[var(--k-t2)] hover:text-[var(--k-t1)]"
        >
          Ver semana
          <ArrowRight size={14} aria-hidden />
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="py-2">
          <p className="text-sm text-[var(--k-t2)]">
            No tienes clases asignadas hoy.
          </p>
          <p className="text-xs text-[var(--k-t3)] mt-1">
            Revisa la programación si esperabas alguna.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {sorted.map((c) => {
            const done = isFinished(c, now);
            const started = c.startsAt.getTime() <= now.getTime();
            const isNext = nextClass?.id === c.id;
            const isCurrent = isNext && started;

            return (
              <li
                key={c.id}
                className="flex flex-col gap-2.5 p-3 rounded-lg transition-colors sm:flex-row sm:items-center sm:justify-between"
                style={{
                  background: isNext
                    ? "var(--k-accent-soft)"
                    : "var(--k-elevated)",
                  border: `1px solid ${
                    isNext ? "var(--k-accent-line)" : "var(--k-line)"
                  }`,
                  opacity: done ? 0.55 : 1,
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">
                    <span
                      className="font-mono"
                      style={{
                        color: isCurrent ? "var(--k-accent)" : "var(--k-t2)",
                      }}
                    >
                      {formatTime24(c.startsAt)}
                    </span>
                    {c.wodName ? (
                      <span className="ml-2 text-[var(--k-t1)]">
                        {c.wodName}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-[var(--k-t2)] mt-0.5">
                    {c.durationMin} min · {occupancy(c.bookedCount, c.capacity)}{" "}
                    · {progressLabel(c, started)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {isNext ? (
                    <>
                      <Link
                        href={`/admin/asistencia#clase-${c.id}` as Route}
                        className="k-btn-grad inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-xs font-bold"
                      >
                        <ClipboardCheck size={14} aria-hidden />
                        Pasar lista
                      </Link>
                      <Link
                        href={
                          `/admin/clases/${c.id}/scores-from-whiteboard` as Route
                        }
                        className="k-btn-ghost inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold"
                      >
                        <Camera size={14} aria-hidden />
                        Cargar pizarra
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={`/admin/asistencia#clase-${c.id}` as Route}
                      className="k-btn-ghost inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold"
                    >
                      <ClipboardCheck size={14} aria-hidden />
                      Pasar lista
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </KCard>
  );
}
