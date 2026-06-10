"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { bookClass } from "@/server/actions/bookings";
import { kToast } from "@/lib/toast";

type BookingState = "idle" | "pending" | "booked" | "waitlist" | "error";

export function OneTapBookButton({
  classId,
  expectedWaitlist,
  fullWidth,
}: {
  classId: string;
  /**
   * If `true`, the suggestion already knows the class will go to waitlist
   * (capacity full) — render label accordingly.
   */
  expectedWaitlist?: boolean;
  fullWidth?: boolean;
}) {
  const [state, setState] = useState<BookingState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (state === "pending" || state === "booked" || state === "waitlist")
      return;
    setErrorMsg(null);
    setState("pending");
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate?.(8);
      } catch {
        /* ignore */
      }
    }
    startTransition(async () => {
      try {
        const decision = await bookClass(classId);
        if (decision.status === "WAITLIST") {
          setState("waitlist");
          if ("vibrate" in navigator) {
            try {
              navigator.vibrate?.([8, 30, 12]);
            } catch {
              /* ignore */
            }
          }
          kToast.info("Estás en lista de espera", {
            description: "Te avisamos si se libera un cupo.",
          });
        } else {
          setState("booked");
          if ("vibrate" in navigator) {
            try {
              navigator.vibrate?.([10, 20, 18]);
            } catch {
              /* ignore */
            }
          }
          kToast.success("¡Reserva confirmada!");
        }
        // Refresh server data so home reflects the new booking.
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al reservar";
        setState("error");
        setErrorMsg(msg);
        kToast.error(msg);
      }
    });
  }

  const label =
    state === "pending"
      ? "Reservando..."
      : state === "booked"
        ? "Reservado ✓"
        : state === "waitlist"
          ? "En lista de espera"
          : state === "error"
            ? "Reintentar"
            : expectedWaitlist
              ? "Anotarme en lista"
              : "Reservar 1-tap";

  const disabled =
    isPending ||
    state === "pending" ||
    state === "booked" ||
    state === "waitlist";

  return (
    <div style={{ width: fullWidth ? "100%" : undefined }}>
      <m.button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        data-testid="one-tap-book-btn"
        data-state={state}
        whileTap={disabled ? undefined : { scale: 0.96 }}
        style={{
          width: fullWidth ? "100%" : undefined,
          background:
            state === "booked"
              ? "var(--k-accent-soft)"
              : state === "waitlist"
                ? "var(--k-warning)"
                : state === "error"
                  ? "var(--k-danger)"
                  : "var(--k-accent)",
          color:
            state === "booked"
              ? "var(--k-accent)"
              : state === "waitlist" || state === "error"
                ? "var(--k-bg)"
                : "var(--k-accent-on)",
          border:
            state === "booked"
              ? "1px solid var(--k-accent-line)"
              : "1px solid transparent",
          borderRadius: 12,
          padding: "12px 18px",
          fontFamily: "var(--k-font-display)",
          fontWeight: 600,
          letterSpacing: "0.04em",
          fontSize: 14,
          cursor: disabled ? "default" : "pointer",
          opacity: disabled && state === "pending" ? 0.85 : 1,
          boxShadow:
            state === "booked" || state === "idle"
              ? "var(--k-accent-glow)"
              : undefined,
          transition: "background 200ms ease, color 200ms ease",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {state === "pending" && <Spinner />}
          {label}
        </span>
      </m.button>
      <AnimatePresence>
        {state === "error" && errorMsg && (
          <m.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "var(--k-danger)",
              fontFamily: "var(--k-font-body)",
            }}
          >
            {errorMsg}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Spinner() {
  return (
    <m.svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    >
      <path d="M21 12a9 9 0 1 1-6.2-8.5" />
    </m.svg>
  );
}
