"use client";

import { useTransition } from "react";
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
      <button
        onClick={handleCancel}
        disabled={isPending}
        className="k-btn-ghost px-3 py-1.5 rounded-md text-xs disabled:opacity-50"
      >
        {isPending ? "…" : "Cancelar"}
      </button>
    );
  }

  if (myStatus === "WAITLIST") {
    return (
      <button
        onClick={handleCancel}
        disabled={isPending}
        className="k-btn-ghost px-3 py-1.5 rounded-md text-xs disabled:opacity-50"
        style={{ color: "var(--text-2)" }}
      >
        {isPending ? "…" : "Quitar de waitlist"}
      </button>
    );
  }

  const full = bookedCount >= capacity;
  return (
    <button
      onClick={handleBook}
      disabled={isPending}
      className="k-btn-grad px-3 py-1.5 rounded-md text-xs disabled:opacity-50"
    >
      {isPending ? "…" : full ? "Unirse a waitlist" : "Reservar"}
    </button>
  );
}

export function CheckInButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await checkInAthlete(bookingId);
        })
      }
      disabled={isPending}
      className="text-xs px-2 py-1 rounded-md disabled:opacity-50"
      style={{ color: "var(--recovery)" }}
    >
      {isPending ? "…" : "Check-in"}
    </button>
  );
}

export function NoShowButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await markNoShow(bookingId);
        })
      }
      disabled={isPending}
      className="text-xs px-2 py-1 rounded-md disabled:opacity-50"
      style={{ color: "var(--pr)" }}
    >
      {isPending ? "…" : "No-show"}
    </button>
  );
}

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => {
        if (!confirm("¿Cancelar reserva del atleta?")) return;
        startTransition(async () => {
          await cancelBooking(bookingId);
        });
      }}
      disabled={isPending}
      className="text-xs px-2 py-1 rounded-md disabled:opacity-50"
      style={{ color: "var(--text-3)" }}
    >
      {isPending ? "…" : "Quitar"}
    </button>
  );
}
