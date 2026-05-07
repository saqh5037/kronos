"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import {
  bookClass,
  cancelBooking,
  checkInAthlete,
  markNoShow,
} from "@/server/actions/bookings";
import { kToast } from "@/lib/toast";
import { useConfirm } from "@/lib/use-confirm";

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
  const confirm = useConfirm();

  function handleBook() {
    startTransition(async () => {
      try {
        await bookClass(classId);
        kToast.success("Reserva confirmada");
      } catch (err) {
        kToast.error(err instanceof Error ? err.message : "Error al reservar");
      }
    });
  }

  async function handleCancel() {
    if (!myBookingId) return;
    const ok = await confirm({
      title: "¿Cancelar tu reserva?",
      message:
        "Liberarás el lugar y otro atleta podrá tomarlo. Si está cerca del horario, podrías no alcanzar a reservar de vuelta.",
      confirmLabel: "Sí, cancelar",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await cancelBooking(myBookingId);
        kToast.info("Reserva cancelada");
      } catch (err) {
        kToast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  const v3Base: React.CSSProperties = {
    fontFamily: "var(--k-font-display)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    padding: "9px 14px",
    borderRadius: 10,
    cursor: isPending ? "wait" : "pointer",
    opacity: isPending ? 0.5 : 1,
    transition: "background 120ms ease, box-shadow 120ms ease",
  };

  if (myStatus === "BOOKED") {
    return (
      <button
        onClick={handleCancel}
        disabled={isPending}
        style={{
          ...v3Base,
          background: "transparent",
          color: "var(--k-t2)",
          border: "1px solid var(--k-line-2)",
        }}
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
        style={{
          ...v3Base,
          background: "transparent",
          color: "var(--k-t2)",
          border: "1px solid var(--k-line-2)",
        }}
      >
        {isPending ? "…" : "Quitar"}
      </button>
    );
  }

  const full = bookedCount >= capacity;
  return (
    <button
      onClick={handleBook}
      disabled={isPending}
      style={{
        ...v3Base,
        background: full ? "var(--k-elevated)" : "var(--k-accent)",
        color: full ? "var(--k-t1)" : "var(--k-accent-on)",
        border: full ? "1px solid var(--k-line-2)" : "none",
        boxShadow: full || isPending ? "none" : "var(--k-accent-glow)",
      }}
    >
      {isPending ? "…" : full ? "Waitlist" : "Reservar"}
    </button>
  );
}

export function CheckInButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <motion.button
      onClick={() =>
        startTransition(async () => {
          try {
            await checkInAthlete(bookingId);
            kToast.success("Check-in registrado");
          } catch (err) {
            kToast.error(
              err instanceof Error ? err.message : "Error en check-in",
            );
          }
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
  const confirm = useConfirm();
  const handleClick = async () => {
    const ok = await confirm({
      title: "¿Marcar como no-show?",
      message:
        "Esto cuenta en las estadísticas del atleta y puede gatillar alertas si es recurrente.",
      confirmLabel: "Marcar no-show",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await markNoShow(bookingId);
        kToast.warning("Marcado como no-show");
      } catch (err) {
        kToast.error(err instanceof Error ? err.message : "Error");
      }
    });
  };
  return (
    <motion.button
      onClick={handleClick}
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
  const confirm = useConfirm();
  const handleClick = async () => {
    const ok = await confirm({
      title: "¿Cancelar reserva del atleta?",
      message: "Se libera el lugar y se promueve waitlist si aplica.",
      confirmLabel: "Cancelar reserva",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await cancelBooking(bookingId);
        kToast.info("Reserva cancelada");
      } catch (err) {
        kToast.error(err instanceof Error ? err.message : "Error");
      }
    });
  };
  return (
    <motion.button
      onClick={handleClick}
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
