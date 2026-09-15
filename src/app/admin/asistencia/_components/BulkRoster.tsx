"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Camera, Check, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { checkInAthlete, markNoShow } from "@/server/actions/bookings";
import type { ClassRoster } from "@/server/actions/bookings";
import { bookingStatusLabel } from "@/lib/labels";
import { formatTime24 } from "@/lib/format";
import { sortClassesByStart } from "../../_lib/schedule";

type Mark = "ATTENDED" | "NOSHOW";

const CHIP_CLASS: Record<string, string> = {
  BOOKED: "k-chip-steel",
  ATTENDED: "k-chip-moss",
  WAITLIST: "k-chip-ghost",
  NOSHOW: "k-chip-ember",
  CANCELLED: "k-chip-ghost",
};

type Props = {
  rosters: ClassRoster[];
  /** Class the coach is here for: rendered expanded (computed on the server). */
  initialOpenClassId?: string | null;
};

/**
 * Check-in for today's classes (audit 2026-09-15, top issue #5).
 *
 * Was: a 16 px native checkbox per row plus a 12 px "Seleccionar 4" link and no
 * visible save. Now: one 44 px "Asistió / No vino" toggle pair per row that
 * stages the mark locally, and a visible "Guardar (N)" bar that commits it
 * through the same `checkInAthlete` / `markNoShow` server actions.
 */
export function BulkRoster({ rosters, initialOpenClassId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [openId, setOpenId] = useState<string | null>(
    initialOpenClassId ?? rosters[0]?.classId ?? null,
  );

  const sorted = useMemo(() => sortClassesByStart(rosters), [rosters]);

  const markCount = Object.keys(marks).length;

  function setMark(bookingId: string, mark: Mark) {
    setMarks((prev) => {
      const next = { ...prev };
      if (next[bookingId] === mark) delete next[bookingId];
      else next[bookingId] = mark;
      return next;
    });
  }

  async function save() {
    const entries = Object.entries(marks);
    if (entries.length === 0) return;
    setSaving(true);
    try {
      for (const [bookingId, mark] of entries) {
        if (mark === "ATTENDED") await checkInAthlete(bookingId);
        else await markNoShow(bookingId);
      }
      setMarks({});
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {markCount > 0 ? (
        <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--k-accent-line)] bg-[var(--k-elevated)] px-4 py-3 shadow-lg">
          <p className="k-eyebrow">
            {markCount} cambio{markCount === 1 ? "" : "s"} sin guardar
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving || pending}
              onClick={save}
              className="k-btn-grad inline-flex min-h-11 items-center gap-1.5 rounded-full px-5 text-sm font-bold disabled:opacity-50"
            >
              <Save size={16} aria-hidden />
              {saving ? "Guardando…" : `Guardar (${markCount})`}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => setMarks({})}
              className="k-btn-ghost inline-flex min-h-11 items-center rounded-full px-4 text-sm"
            >
              Descartar
            </button>
          </div>
        </div>
      ) : null}

      {sorted.map((roster) => {
        const present = roster.bookings.filter(
          (b) => b.status === "BOOKED" || b.status === "ATTENDED",
        );
        const attended = roster.bookings.filter(
          (b) => b.status === "ATTENDED",
        ).length;
        // Every athlete the coach can still act on or has to see — including
        // NOSHOW rows, which the old list dropped entirely.
        const visible = roster.bookings.filter((b) => b.status !== "CANCELLED");
        const isOpen = openId === roster.classId;

        return (
          <div
            key={roster.classId}
            className="k-card"
            id={`clase-${roster.classId}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--k-line)] px-4 py-3">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : roster.classId)}
                aria-expanded={isOpen}
                className="flex min-h-11 flex-1 items-center gap-3 text-left"
              >
                <span className="font-display text-xl font-bold">
                  {formatTime24(roster.startsAt)}
                </span>
                <span>
                  <span className="block text-sm font-medium">
                    {roster.wodName ?? "Open Box"}
                  </span>
                  {roster.coachName ? (
                    <span className="mt-0.5 block text-[10px] text-[var(--k-t2)]">
                      {roster.coachName}
                    </span>
                  ) : null}
                </span>
              </button>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={
                    `/admin/clases/${roster.classId}/scores-from-whiteboard` as Route
                  }
                  className="k-btn-ghost inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold"
                >
                  <Camera size={14} aria-hidden />
                  Cargar pizarra
                </Link>
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: "var(--k-accent)" }}
                >
                  {attended}/{present.length}
                </span>
              </div>
            </div>

            {isOpen ? (
              <div className="p-4">
                {visible.length === 0 ? (
                  <p className="text-xs text-[var(--k-t2)]">Sin reservas.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {visible.map((b) => {
                      const staged = marks[b.bookingId];
                      const effective = staged ?? b.status;
                      return (
                        <li
                          key={b.bookingId}
                          className="flex flex-col gap-2 rounded-lg px-1 py-1 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {b.firstName} {b.lastName}
                            </p>
                            <span
                              className={`k-chip ${CHIP_CLASS[effective] ?? "k-chip-ghost"} mt-1 text-[10px]`}
                            >
                              {bookingStatusLabel[effective]}
                              {staged ? " · sin guardar" : ""}
                            </span>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => setMark(b.bookingId, "ATTENDED")}
                              aria-pressed={effective === "ATTENDED"}
                              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-xs font-bold transition-colors"
                              style={{
                                background:
                                  effective === "ATTENDED"
                                    ? "var(--k-accent)"
                                    : "var(--k-elevated)",
                                color:
                                  effective === "ATTENDED"
                                    ? "var(--k-accent-on)"
                                    : "var(--k-t2)",
                                border: `1px solid ${
                                  effective === "ATTENDED"
                                    ? "var(--k-accent)"
                                    : "var(--k-line-2)"
                                }`,
                              }}
                            >
                              <Check size={14} aria-hidden />
                              Asistió
                            </button>
                            <button
                              type="button"
                              onClick={() => setMark(b.bookingId, "NOSHOW")}
                              aria-pressed={effective === "NOSHOW"}
                              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-xs font-bold transition-colors"
                              style={{
                                background:
                                  effective === "NOSHOW"
                                    ? "var(--k-danger)"
                                    : "var(--k-elevated)",
                                color:
                                  effective === "NOSHOW"
                                    ? "var(--k-bg)"
                                    : "var(--k-t2)",
                                border: `1px solid ${
                                  effective === "NOSHOW"
                                    ? "var(--k-danger)"
                                    : "var(--k-line-2)"
                                }`,
                              }}
                            >
                              <X size={14} aria-hidden />
                              No vino
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
