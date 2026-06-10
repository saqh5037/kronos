/**
 * DayContentSection — streams the eyebrow + class list for the selected day.
 *
 * Receives selected/today as ISO strings (serializable over RSC boundary).
 * Fetches listAvailableClasses once; used by only ONE section, so no cache needed.
 */

import Link from "next/link";
import type { Route } from "next";
import { type AvailableClass } from "@/server/actions/bookings";
import { getBoxTimezone } from "@/server/cache";
import { getCachedSession } from "@/server/session";
import { listWeekClassesCached } from "../request-cache";
import { ClassesList } from "../ClassesList";
import { Icon } from "@/components/kronos/v3/icons";

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

export async function DayContentSection({
  selectedIso,
  todayIso,
}: {
  selectedIso: string;
  todayIso: string;
}) {
  const selected = new Date(selectedIso);

  let dayClasses: AvailableClass[] = [];
  let boxTimezone = "UTC";
  try {
    const session = await getCachedSession();
    if (session?.user?.tenantId) {
      boxTimezone = await getBoxTimezone(session.user.tenantId);
    }
    const all = await listWeekClassesCached(todayIso);
    dayClasses = all.filter((c) => sameDay(c.startsAt, selected));
  } catch {
    // no session
  }

  const dayLabel = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
  }).format(selected);

  return (
    <>
      {/* Eyebrow del día */}
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
                Ver mañana →
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
