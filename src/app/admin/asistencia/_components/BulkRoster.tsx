"use client";

import { useState, useTransition } from "react";
import { checkInAthlete, markNoShow } from "@/server/actions/bookings";
import { useRouter } from "next/navigation";
import type { ClassRoster } from "@/server/actions/bookings";

const fmtTime = (d: Date) =>
  d.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

function chipForStatus(status: string): string {
  switch (status) {
    case "BOOKED":
      return "k-chip-steel";
    case "ATTENDED":
      return "k-chip-moss";
    case "WAITLIST":
      return "k-chip-ghost";
    case "NOSHOW":
    case "CANCELLED":
      return "k-chip-ember";
    default:
      return "k-chip-ghost";
  }
}

export function BulkRoster({ rosters }: { rosters: ClassRoster[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle(bookingId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(bookingId)) next.delete(bookingId);
      else next.add(bookingId);
      return next;
    });
  }

  async function bulkCheckIn() {
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) => checkInAthlete(id)));
    setSelected(new Set());
    startTransition(() => router.refresh());
  }

  async function bulkNoShow() {
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) => markNoShow(id)));
    setSelected(new Set());
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col gap-4">
      {selected.size > 0 ? (
        <div className="sticky top-2 z-10 flex items-center justify-between gap-3 rounded-xl border border-[var(--k-line-2)] bg-[var(--k-elevated)] px-4 py-2 shadow-lg">
          <p className="k-eyebrow">{selected.size} seleccionados</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={bulkCheckIn}
              className="rounded-lg border border-[var(--k-accent-line)] bg-[var(--k-accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--k-accent)] disabled:opacity-50"
            >
              ✓ Check-in
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={bulkNoShow}
              className="rounded-lg border border-[rgba(255, 90, 90, 0.3)] bg-[rgba(255, 90, 90, 0.1)] px-3 py-1.5 text-xs font-semibold text-[var(--k-warning)] disabled:opacity-50"
            >
              ✕ No-show
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-[var(--k-t3)] hover:text-[var(--k-t2)]"
            >
              Limpiar
            </button>
          </div>
        </div>
      ) : null}

      {rosters.map((roster) => {
        const booked = roster.bookings.filter(
          (b) => b.status === "BOOKED" || b.status === "ATTENDED",
        );
        const attended = roster.bookings.filter(
          (b) => b.status === "ATTENDED",
        ).length;
        const bookedIds = roster.bookings
          .filter((b) => b.status === "BOOKED")
          .map((b) => b.bookingId);
        const allSelected =
          bookedIds.length > 0 && bookedIds.every((id) => selected.has(id));

        return (
          <div key={roster.classId} className="k-card">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--k-line)] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="font-display text-xl font-bold">
                  {fmtTime(roster.startsAt)}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {roster.wodName ?? "Sin WOD"}
                  </p>
                  {roster.coachName ? (
                    <p className="mt-0.5 text-[10px] text-[var(--k-t3)]">
                      {roster.coachName}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {bookedIds.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (allSelected) {
                          bookedIds.forEach((id) => next.delete(id));
                        } else {
                          bookedIds.forEach((id) => next.add(id));
                        }
                        return next;
                      });
                    }}
                    className="rounded-md px-2 py-1.5 text-[10px] text-[var(--k-t2)] hover:bg-[var(--k-elevated)] hover:text-[var(--k-t1)]"
                  >
                    {allSelected
                      ? "Deseleccionar"
                      : `Seleccionar ${bookedIds.length}`}
                  </button>
                ) : null}
                <div
                  className="font-mono text-sm font-bold"
                  style={{ color: "var(--k-accent)" }}
                >
                  {attended}/{booked.length}
                </div>
              </div>
            </div>

            <div className="p-4">
              {roster.bookings.length === 0 ? (
                <p className="text-xs text-[var(--k-t3)]">Sin reservas.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {roster.bookings.map((b) => {
                    const canSelect = b.status === "BOOKED";
                    const isSelected = selected.has(b.bookingId);
                    return (
                      <li
                        key={b.bookingId}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <label className="flex items-center gap-2">
                          {canSelect ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggle(b.bookingId)}
                              aria-label={`Seleccionar ${b.firstName} ${b.lastName}`}
                            />
                          ) : (
                            <span className="inline-block w-3" />
                          )}
                          <span className="font-medium">
                            {b.firstName} {b.lastName}
                          </span>
                        </label>
                        <span
                          className={`k-chip ${chipForStatus(b.status)} text-[10px]`}
                        >
                          {b.status}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
