import Link from "next/link";
import type { AvailableClass } from "@/server/actions/bookings";

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MonthGrid({
  monthAnchor,
  classes,
}: {
  monthAnchor: Date;
  classes: AvailableClass[];
}) {
  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startOffset = (first.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + last.getDate()) / 7) * 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = ymd(today);

  const byDay = new Map<string, AvailableClass[]>();
  for (const c of classes) {
    const k = ymd(new Date(c.startsAt));
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(c);
  }

  const days = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1;
    const date = new Date(year, month, dayNum);
    return { date, inMonth: date.getMonth() === month };
  });

  const labels = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div
      style={{
        padding: 12,
        background: "var(--k-surface)",
        border: "1px solid var(--k-line)",
        borderRadius: 16,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          marginBottom: 6,
        }}
      >
        {labels.map((l, i) => (
          <p
            key={i}
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textAlign: "center",
              padding: "4px 0",
              color: "var(--k-t3)",
              margin: 0,
            }}
          >
            {l}
          </p>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
        }}
      >
        {days.map(({ date, inMonth }, i) => {
          const k = ymd(date);
          const dayClasses = byDay.get(k) ?? [];
          const isToday = k === todayKey;
          const myBookings = dayClasses.filter(
            (c) =>
              c.myBookingStatus === "BOOKED" ||
              c.myBookingStatus === "WAITLIST",
          ).length;
          const numColor = isToday
            ? "var(--k-accent-on)"
            : inMonth
              ? "var(--k-t1)"
              : "var(--k-t3)";

          return (
            <Link
              key={i}
              href={{
                pathname: "/atleta/reservar",
                query: { view: "day", date: k },
              }}
              style={{
                borderRadius: 10,
                padding: 6,
                minHeight: 60,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: isToday
                  ? "var(--k-accent)"
                  : inMonth
                    ? "var(--k-elevated)"
                    : "transparent",
                border: isToday
                  ? "none"
                  : `1px solid ${inMonth ? "var(--k-line)" : "transparent"}`,
                opacity: inMonth ? 1 : 0.45,
                textDecoration: "none",
                boxShadow: isToday ? "var(--k-accent-glow)" : "none",
                transition: "background 150ms ease",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: numColor,
                  margin: 0,
                }}
              >
                {date.getDate()}
              </p>
              {myBookings > 0 ? (
                <span
                  style={{
                    marginTop: 4,
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: isToday
                      ? "var(--k-accent-on)"
                      : "var(--k-accent)",
                  }}
                />
              ) : dayClasses.length > 0 ? (
                <span
                  style={{
                    marginTop: 4,
                    fontFamily: "var(--k-font-display)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    color: isToday ? "var(--k-accent-on)" : "var(--k-t3)",
                  }}
                >
                  {dayClasses.length}
                </span>
              ) : (
                <span style={{ marginTop: 4, height: 6, display: "block" }} />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
