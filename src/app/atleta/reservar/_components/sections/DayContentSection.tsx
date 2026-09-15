/**
 * DayContentSection — streams the booked summary, eyebrow and class list.
 *
 * Audit 2026-09-15 (P2, /atleta/reservar):
 *  - "MARTES 15 · 6 CLASES", then "6 CLASES", then "15-SEP" stated the same
 *    fact three times in 120 px → one eyebrow line.
 *  - "No 'tienes clase mañana 06:00' summary; the lime dot on MIÉ 16 is the
 *    only booked indicator" → a booked summary line sits above the list.
 *
 * Receives selected/today as ISO strings (serializable over RSC boundary).
 * Fetches listWeekClasses once; used by only ONE section, so no cache needed.
 */

import Link from "next/link";
import type { Route } from "next";
import { CalendarCheck } from "lucide-react";
import { type AvailableClass } from "@/server/actions/bookings";
import { getBoxTimezone } from "@/server/cache";
import { getCachedSession } from "@/server/session";
import { listWeekClassesCached } from "../request-cache";
import { ClassesList } from "../ClassesList";
import { Icon } from "@/components/kronos/v3/icons";
import { formatTime24, formatDateWeekday } from "@/lib/format";

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function nextDayDateKey(selected: Date): string {
  const next = new Date(selected);
  next.setDate(next.getDate() + 1);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, "0");
  const d = String(next.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "Hoy" / "Mañana" / "mar 16 sep" — the athlete's frame of reference. */
function whenLabel(date: Date, today: Date): string {
  if (sameDay(date, today)) return "Hoy";
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (sameDay(date, tomorrow)) return "Mañana";
  return formatDateWeekday(date);
}

export async function DayContentSection({
  selectedIso,
  todayIso,
}: {
  selectedIso: string;
  todayIso: string;
}) {
  const selected = new Date(selectedIso);
  const today = new Date(todayIso);

  let dayClasses: AvailableClass[] = [];
  let allClasses: AvailableClass[] = [];
  let boxTimezone = "UTC";
  try {
    const session = await getCachedSession();
    if (session?.user?.tenantId) {
      boxTimezone = await getBoxTimezone(session.user.tenantId);
    }
    allClasses = await listWeekClassesCached(todayIso);
    dayClasses = allClasses.filter((c) => sameDay(c.startsAt, selected));
  } catch {
    // no session
  }

  // The athlete's next booked class this week, whichever day it falls on.
  const nextBooked = allClasses
    .filter(
      (c) =>
        c.myBookingStatus === "BOOKED" &&
        c.startsAt.getTime() >= today.getTime(),
    )
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];

  const dayLabel = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(selected);

  return (
    <>
      {/* Resumen de tu próxima reserva — la respuesta a "¿ya reservé?" */}
      {nextBooked && (
        <div style={{ padding: "0 20px", marginTop: 14 }}>
          <Link
            href={`/atleta/reservar?date=${nextBooked.startsAt.getFullYear()}-${String(
              nextBooked.startsAt.getMonth() + 1,
            ).padStart(2, "0")}-${String(nextBooked.startsAt.getDate()).padStart(2, "0")}` as Route}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderRadius: 12,
              background: "var(--k-accent-soft)",
              border: "1px solid var(--k-accent-line)",
              color: "var(--k-t1)",
              textDecoration: "none",
              minHeight: 48,
            }}
          >
            <CalendarCheck
              width={16}
              height={16}
              aria-hidden
              style={{ color: "var(--k-accent)", flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: "var(--k-font-body)",
                fontSize: 13,
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {whenLabel(nextBooked.startsAt, today)}{" "}
              {formatTime24(nextBooked.startsAt)}
              {nextBooked.coach?.name ? ` · ${nextBooked.coach.name}` : ""} ·{" "}
              {nextBooked.bookedCount}/{nextBooked.capacity}
            </span>
          </Link>
        </div>
      )}

      {/* Eyebrow del día — una sola línea con el día y el conteo */}
      <div style={{ padding: "0 20px", marginTop: 16 }}>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.18em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
          }}
        >
          {dayLabel} · {dayClasses.length} CLASE
          {dayClasses.length === 1 ? "" : "S"}
        </span>
      </div>

      {/* Lista de clases del día */}
      <div style={{ marginTop: 14 }}>
        {dayClasses.length === 0 ? (
          <div
            style={{
              margin: "12px 20px 0",
              padding: "48px 24px",
              background: "var(--k-surface)",
              border: "1px dashed var(--k-line)",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "var(--k-elevated)",
                border: "1px solid var(--k-line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--k-t3)",
              }}
            >
              <Icon.CalX width={28} height={28} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span
                style={{
                  fontFamily: "var(--k-font-body)",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--k-t1)",
                  letterSpacing: "-0.01em",
                }}
              >
                Sin clases programadas
              </span>
              <span
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--k-t3)",
                  letterSpacing: "0.14em",
                }}
              >
                ELIGE OTRO DÍA EN LA SEMANA
              </span>
              <Link
                href={`/atleta/reservar?date=${nextDayDateKey(selected)}` as Route}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px 20px",
                  borderRadius: 10,
                  background: "var(--k-elevated)",
                  border: "1px solid var(--k-line)",
                  color: "var(--k-t2)",
                  fontFamily: "var(--k-font-display)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  minHeight: 40,
                }}
              >
                Ver mañana
              </Link>
            </div>
          </div>
        ) : (
          <ClassesList
            classes={dayClasses}
            usualHours={[]}
            boxTimezone={boxTimezone}
          />
        )}
      </div>
    </>
  );
}
