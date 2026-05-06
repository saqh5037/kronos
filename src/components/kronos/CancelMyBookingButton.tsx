"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import { cancelBooking } from "@/server/actions/bookings";
import { kToast } from "@/lib/toast";

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
        kToast.info("Reserva cancelada");
      } catch (err) {
        kToast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={isPending}
      className="text-[11px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
      style={{
        background: "var(--btn-ghost-bg)",
        border: "1px solid var(--line)",
        color: "var(--text-2)",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isPending ? "…" : "Cancelar"}
    </motion.button>
  );
}
