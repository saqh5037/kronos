"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  bookClass,
  cancelBooking,
  checkInAthlete,
  markNoShow,
} from "@/server/actions/bookings";
import { kToast } from "@/lib/toast";
import { useConfirm } from "@/lib/use-confirm";
import { JargonTip } from "@/components/kronos/JargonTip";

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
  const [justBooked, setJustBooked] = useState(false);
  const [justCancelled, setJustCancelled] = useState(false);
  const confirm = useConfirm();

  function handleBook() {
    startTransition(async () => {
      try {
        await bookClass(classId);
        setJustBooked(true);
        kToast.success("Reserva confirmada");
        // Reset the optimistic confirmation after 4s so it reflects server state
        setTimeout(() => setJustBooked(false), 4000);
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
        setJustCancelled(true);
        kToast.info("Reserva cancelada");
        setTimeout(() => setJustCancelled(false), 3000);
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

  // Optimistic "Reservado ✓" — shown right after booking while page revalidates
  if (myStatus === "BOOKED" || justBooked) {
    if (justCancelled) {
      // Show brief "Cancelado" feedback before server revalidation
      return (
        <button
          disabled
          style={{
            ...v3Base,
            background: "transparent",
            color: "var(--k-t3)",
            border: "1px solid var(--k-line)",
            cursor: "default",
          }}
          aria-label="Reserva cancelada"
        >
          Cancelado
        </button>
      );
    }
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          alignItems: "flex-end",
        }}
      >
        {/* Confirmed checkmark badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 12px",
            borderRadius: 10,
            background: "var(--k-accent-soft)",
            border: "1px solid var(--k-accent-line)",
          }}
          aria-label="Reservado"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--k-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "var(--k-accent)",
            }}
          >
            RESERVADO
          </span>
        </div>
        {/* Cancel affordance — smaller, subdued */}
        <button
          onClick={handleCancel}
          disabled={isPending}
          style={{
            background: "none",
            border: "none",
            padding: "2px 4px",
            fontFamily: "var(--k-font-display)",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.12em",
            color: "var(--k-t3)",
            cursor: isPending ? "wait" : "pointer",
            textDecoration: "underline",
            textDecorationColor: "var(--k-line-2)",
            textUnderlineOffset: 2,
          }}
        >
          {isPending ? "…" : "Cancelar"}
        </button>
      </div>
    );
  }

  if (myStatus === "WAITLIST") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 12px",
            borderRadius: 10,
            background: "var(--k-elevated)",
            border: "1px solid var(--k-line-2)",
          }}
          aria-label="En lista de espera"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--k-t2)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "var(--k-t2)",
            }}
          >
            EN ESPERA
          </span>
        </div>
        <button
          onClick={handleCancel}
          disabled={isPending}
          style={{
            background: "none",
            border: "none",
            padding: "2px 4px",
            fontFamily: "var(--k-font-display)",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.12em",
            color: "var(--k-t3)",
            cursor: isPending ? "wait" : "pointer",
            textDecoration: "underline",
            textDecorationColor: "var(--k-line-2)",
            textUnderlineOffset: 2,
          }}
        >
          {isPending ? "…" : "Salir de espera"}
        </button>
      </div>
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
      {isPending ? (
        "…"
      ) : full ? (
        <JargonTip term="WAITLIST">Waitlist</JargonTip>
      ) : (
        "Reservar"
      )}
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
        color: "var(--k-accent)",
        background: "var(--k-accent-soft)",
        border: "1px solid var(--k-accent-line)",
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
        color: "var(--k-danger)",
        background: "rgba(255, 90, 90, 0.1)",
        border: "1px solid rgba(255, 90, 90, 0.3)",
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
        color: "var(--k-t3)",
        background: "var(--k-elevated)",
        border: "1px solid var(--k-line)",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isPending ? "…" : "Quitar"}
    </motion.button>
  );
}
