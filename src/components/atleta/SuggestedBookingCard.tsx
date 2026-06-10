"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { OneTapBookButton } from "./OneTapBookButton";
import { formatTime, formatDayMonth } from "@/lib/week";

type SuggestionShape = {
  klass: {
    id: string;
    startsAt: Date | string;
    bookedCount: number;
    capacity: number;
    coach: { name: string | null } | null;
    wod: { name: string; type: string } | null;
  };
  reason: "habitual" | "fallback";
  willGoToWaitlist: boolean;
};

export function SuggestedBookingCard({
  suggestion,
}: {
  suggestion: SuggestionShape;
}) {
  const startsAt =
    typeof suggestion.klass.startsAt === "string"
      ? new Date(suggestion.klass.startsAt)
      : suggestion.klass.startsAt;
  // Patrón anti hydration mismatch: server y primer render del cliente
  // muestran el día calendárico; tras mount, si la fecha es hoy en la TZ
  // local del navegador, sustituimos por "HOY".
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);
  const isToday = now !== null && isSameDay(startsAt, new Date(now));
  const dayLabel = isToday ? "HOY" : formatDayMonth(startsAt).toUpperCase();
  const timeLabel = formatTime(startsAt);
  const capacityFraction = `${suggestion.klass.bookedCount}/${suggestion.klass.capacity}`;

  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      data-testid="suggested-booking-card"
      data-reason={suggestion.reason}
      className="k-card-featured"
      style={{
        position: "relative",
        padding: "14px 14px 16px",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 80% 10%, var(--k-accent-soft), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative" }}>
        <div className="flex items-center justify-between mb-3">
          <span
            className="k-mono"
            style={{
              fontSize: 9,
              letterSpacing: 1.5,
              color:
                suggestion.reason === "habitual"
                  ? "var(--k-accent)"
                  : "var(--k-t2)",
            }}
          >
            {suggestion.reason === "habitual"
              ? "TU HORARIO HABITUAL"
              : "PRÓXIMA CON CUPO"}
          </span>
          {suggestion.willGoToWaitlist && (
            <span
              className="k-mono"
              style={{
                fontSize: 9,
                letterSpacing: 1.5,
                color: "var(--k-warning)",
              }}
            >
              LLENO · LISTA DE ESPERA
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div
            style={{
              minWidth: 60,
              padding: "10px 8px",
              borderRadius: 12,
              background: "var(--k-elevated)",
              border: "1px solid var(--k-line)",
              textAlign: "center",
            }}
          >
            <div
              className="k-mono"
              style={{
                fontSize: 9,
                letterSpacing: 1.2,
                color: "var(--k-t3)",
                marginBottom: 2,
              }}
            >
              {dayLabel}
            </div>
            <div
              className="k-mono"
              style={{
                fontSize: 22,
                color: "var(--k-accent)",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {timeLabel}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--k-font-body)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--k-t1)",
                marginBottom: 2,
                lineHeight: 1.2,
              }}
            >
              {suggestion.klass.wod?.name ?? "Clase abierta"}
            </div>
            <div
              style={{
                fontFamily: "var(--k-font-body)",
                fontSize: 12,
                color: "var(--k-t2)",
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {suggestion.klass.coach?.name && (
                <span>Coach {suggestion.klass.coach.name}</span>
              )}
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ color: "var(--k-accent)" }}>
                ● {capacityFraction}
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <OneTapBookButton
            classId={suggestion.klass.id}
            expectedWaitlist={suggestion.willGoToWaitlist}
            fullWidth
          />
        </div>
      </div>
    </m.div>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
