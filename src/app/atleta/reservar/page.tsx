import Link from "next/link";
import {
  listAvailableClasses,
  type AvailableClass,
} from "@/server/actions/bookings";
import { ClassesList } from "./_components/ClassesList";
import { Icon } from "@/components/kronos/v3/icons";

export const metadata = { title: "Kronos — Reservar" };

type SearchParams = { date?: string };

const DAY_ABBR = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

function parseDate(s: string | undefined): Date {
  if (s) {
    const [y, m, d] = s.split("-").map(Number);
    if (y && m && d) {
      const dt = new Date(y, m - 1, d);
      dt.setHours(0, 0, 0, 0);
      return dt;
    }
  }
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function formatDateParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default async function ReservarPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = parseDate(sp.date);

  // 7 days starting today
  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  // Fetch classes for selected day
  let dayClasses: AvailableClass[] = [];
  let weekClasses: AvailableClass[] = [];
  try {
    const all = await listAvailableClasses(7, today);
    weekClasses = all;
    dayClasses = all.filter((c) => sameDay(c.startsAt, selected));
  } catch {
    // sin sesión
  }

  const hasReservedOn = (d: Date) =>
    weekClasses.some(
      (c) => sameDay(c.startsAt, d) && c.myBookingStatus === "BOOKED",
    );

  const dayLabel = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
  }).format(selected);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--k-bg)",
        color: "var(--k-t1)",
        fontFamily: "var(--k-font-body)",
        paddingBottom: 96,
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 48,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 8,
        }}
      >
        <Link
          href="/atleta"
          aria-label="Volver"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "transparent",
            border: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--k-t1)",
            textDecoration: "none",
          }}
        >
          <Icon.Back width={20} height={20} />
        </Link>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--k-t2)",
          }}
        >
          RESERVAR
        </span>
        <button
          type="button"
          aria-label="Filtros"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "transparent",
            border: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--k-t1)",
          }}
        >
          <Icon.Filter width={20} height={20} />
        </button>
      </div>

      {/* Week strip */}
      <div
        style={{
          padding: "0 20px",
          display: "flex",
          gap: 8,
          overflowX: "auto",
          marginTop: 12,
        }}
      >
        {days.map((d) => {
          const isSel = sameDay(d, selected);
          const isToday = sameDay(d, today);
          const reserved = hasReservedOn(d);
          return (
            <Link
              key={d.toISOString()}
              href={
                {
                  pathname: "/atleta/reservar",
                  query: { date: formatDateParam(d) },
                } as unknown as React.ComponentProps<typeof Link>["href"]
              }
              className="k-tap"
              style={{
                flexShrink: 0,
                width: 54,
                height: 74,
                borderRadius: 14,
                background: isSel ? "var(--k-elevated)" : "var(--k-surface)",
                border:
                  !isSel && isToday
                    ? "1px dashed var(--k-accent)"
                    : `1px solid ${isSel ? "var(--k-line-2)" : "var(--k-line)"}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                position: "relative",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  color: "var(--k-t3)",
                }}
              >
                {DAY_ABBR[d.getDay()]}
              </span>
              <span
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: isSel ? "var(--k-accent)" : "var(--k-t1)",
                  lineHeight: 1,
                }}
              >
                {d.getDate()}
              </span>
              {reserved && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 8,
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "var(--k-accent)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>

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
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                ELEGÍ OTRO DÍA EN LA SEMANA
              </span>
            </div>
          </div>
        ) : (
          <ClassesList classes={dayClasses} usualHours={[]} />
        )}
      </div>
    </div>
  );
}
