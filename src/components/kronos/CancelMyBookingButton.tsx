"use client";

import { useTransition } from "react";
import { cancelBooking } from "@/server/actions/bookings";

export default function CancelMyBookingButton({
  bookingId,
}: {
  bookingId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Cancelar tu reserva?")) return;
    startTransition(async () => {
      try {
        await cancelBooking(bookingId);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-[11px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-opacity"
      style={{
        background: "transparent",
        border: "1px solid var(--line)",
        color: "var(--text-2)",
      }}
    >
      {isPending ? "…" : "Cancelar"}
    </button>
  );
}
