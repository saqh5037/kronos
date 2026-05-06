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
    <div className="k-card p-3">
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {labels.map((l, i) => (
          <p
            key={i}
            className="font-mono text-[10px] font-bold text-center py-1"
            style={{ color: "var(--text-3)" }}
          >
            {l}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, inMonth }, i) => {
          const k = ymd(date);
          const dayClasses = byDay.get(k) ?? [];
          const isToday = k === todayKey;
          const myBookings = dayClasses.filter(
            (c) =>
              c.myBookingStatus === "BOOKED" ||
              c.myBookingStatus === "WAITLIST",
          ).length;

          return (
            <Link
              key={i}
              href={{
                pathname: "/atleta/reservar",
                query: { view: "day", date: k },
              }}
              className="rounded-lg p-1.5 min-h-[60px] flex flex-col items-center justify-center transition-all"
              style={{
                background: isToday
                  ? "var(--grad)"
                  : inMonth
                    ? "var(--card-2)"
                    : "transparent",
                border: `1px solid ${isToday ? "transparent" : "var(--line)"}`,
                opacity: inMonth ? 1 : 0.35,
              }}
            >
              <p
                className="font-display text-base font-bold"
                style={{
                  color: isToday ? "#0a0a0c" : "var(--text)",
                }}
              >
                {date.getDate()}
              </p>
              {myBookings > 0 ? (
                <span
                  className="mt-0.5 w-1.5 h-1.5 rounded-full"
                  style={{
                    background: isToday ? "#0a0a0c" : "var(--recovery)",
                  }}
                />
              ) : dayClasses.length > 0 ? (
                <span
                  className="mt-0.5 font-mono text-[8px]"
                  style={{
                    color: isToday ? "#0a0a0c" : "var(--text-3)",
                  }}
                >
                  {dayClasses.length}
                </span>
              ) : (
                <span className="mt-0.5 h-1.5" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
