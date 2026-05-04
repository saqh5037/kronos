"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import {
  bookClass,
  cancelBooking,
  checkInAthlete,
  markNoShow,
} from "@/server/actions/bookings";

export function BookButton({
  classId,
  bookedCount,
  capacity,
  myStatus,
  myBookingId,
}: {
  classId: string;
  bookedCount: number;
  capacity: number;
  myStatus: string | null;
  myBookingId: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleBook() {
    startTransition(async () => {
      try {
        await bookClass(classId);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Error al reservar");
      }
    });
  }

  function handleCancel() {
    if (!myBookingId) return;
    if (!confirm("¿Cancelar tu reserva?")) return;
    startTransition(async () => {
      try {
        await cancelBooking(myBookingId);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Error");
      }
    });
  }

  if (myStatus === "BOOKED") {
    return (
      <motion.button
        onClick={handleCancel}
        disabled={isPending}
        className="k-btn-ghost px-3 py-2 rounded-lg text-xs disabled:opacity-50"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {isPending ? "…" : "Cancelar"}
      </motion.button>
    );
  }

  if (myStatus === "WAITLIST") {
    return (
      <motion.button
        onClick={handleCancel}
        disabled={isPending}
        className="k-btn-ghost px-3 py-2 rounded-lg text-xs disabled:opacity-50"
        style={{ color: "var(--text-2)" }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {isPending ? "…" : "Quitar de waitlist"}
      </motion.button>
    );
  }

  const full = bookedCount >= capacity;
  return (
    <motion.button
      onClick={handleBook}
      disabled={isPending}
      className="k-btn-grad px-3 py-2 rounded-lg text-xs disabled:opacity-50"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
    >
      {isPending ? "…" : full ? "Unirse a waitlist" : "Reservar"}
    </motion.button>
  );
}

export function CheckInButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <motion.button
      onClick={() =>
        startTransition(async () => {
          await checkInAthlete(bookingId);
        })
      }
      disabled={isPending}
      className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 font-semibold"
      style={{
        color: "var(--recovery)",
        background: "var(--recovery-soft)",
        border: "1px solid var(--recovery-line)",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isPending ? "…" : "Check-in"}
    </motion.button>
  );
}

export function NoShowButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <motion.button
      onClick={() =>
        startTransition(async () => {
          await markNoShow(bookingId);
        })
      }
      disabled={isPending}
      className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 font-semibold"
      style={{
        color: "var(--pr)",
        background: "var(--pr-soft)",
        border: "1px solid var(--pr-line)",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isPending ? "…" : "No-show"}
    </motion.button>
  );
}

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <motion.button
      onClick={() => {
        if (!confirm("¿Cancelar reserva del atleta?")) return;
        startTransition(async () => {
          await cancelBooking(bookingId);
        });
      }}
      disabled={isPending}
      className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 font-medium"
      style={{
        color: "var(--text-3)",
        background: "var(--btn-ghost-bg)",
        border: "1px solid var(--line)",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isPending ? "…" : "Quitar"}
    </motion.button>
  );
}
