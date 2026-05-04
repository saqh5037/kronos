"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckInButton,
  NoShowButton,
  CancelBookingButton,
} from "@/components/BookingActions";
import { formatTime } from "@/lib/week";
import type { ClassRoster } from "@/server/actions/bookings";

export default function CollapsibleRoster({ roster }: { roster: ClassRoster }) {
  const [open, setOpen] = useState(true);

  const booked = roster.bookings.filter(
    (b) => b.status === "BOOKED" || b.status === "ATTENDED",
  );
  const waitlist = roster.bookings.filter((b) => b.status === "WAITLIST");
  const fillRatio = booked.length / roster.capacity;
  const chip =
    fillRatio >= 1
      ? "k-chip-pr"
      : fillRatio >= 0.7
        ? "k-chip-strain"
        : "k-chip-recovery";

  return (
    <div className="k-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between gap-4 text-left"
        style={{ borderBottom: open ? "1px solid var(--line)" : "none" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="font-display font-bold text-xl min-w-[52px]"
            style={{ letterSpacing: "-0.02em" }}
          >
            {formatTime(roster.startsAt)}
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-base truncate">
              {roster.wodName ?? "Sin WOD asignado"}
            </h3>
            {roster.coachName && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                Coach: {roster.coachName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`k-chip ${chip}`}>
            {booked.length}/{roster.capacity}
          </span>
          {waitlist.length > 0 && (
            <span className="k-chip k-chip-ghost">
              +{waitlist.length} waitlist
            </span>
          )}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="transition-transform"
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              color: "var(--text-3)",
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              {roster.bookings.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-3)" }}>
                  Sin reservas todavía.
                </p>
              ) : (
                <table className="k-table text-sm">
                  <thead>
                    <tr>
                      <th className="text-left pb-2 k-eyebrow">Atleta</th>
                      <th className="text-left pb-2 k-eyebrow">Estado</th>
                      <th className="text-left pb-2 k-eyebrow">Reservó</th>
                      <th className="text-right pb-2 k-eyebrow">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.bookings.map((b) => (
                      <tr key={b.bookingId} className="k-row">
                        <td className="py-2 font-medium">
                          {b.firstName} {b.lastName}
                        </td>
                        <td className="py-2">
                          <span className={`k-chip ${chipForStatus(b.status)}`}>
                            {b.status}
                          </span>
                        </td>
                        <td
                          className="py-2 font-mono text-xs"
                          style={{ color: "var(--text-3)" }}
                        >
                          {formatTime(b.bookedAt)}
                        </td>
                        <td className="py-2">
                          <div className="flex items-center justify-end gap-2">
                            {b.status === "BOOKED" && (
                              <>
                                <CheckInButton bookingId={b.bookingId} />
                                <NoShowButton bookingId={b.bookingId} />
                                <CancelBookingButton bookingId={b.bookingId} />
                              </>
                            )}
                            {b.status === "WAITLIST" && (
                              <CancelBookingButton bookingId={b.bookingId} />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function chipForStatus(status: string): string {
  switch (status) {
    case "BOOKED":
      return "k-chip-strain";
    case "ATTENDED":
      return "k-chip-recovery";
    case "WAITLIST":
      return "k-chip-ghost";
    case "NOSHOW":
    case "CANCELLED":
      return "k-chip-pr";
    default:
      return "k-chip-ghost";
  }
}
