/**
 * WeekStrip — 7-day selector for the booking page.
 *
 * Pure presentational: day labels/numbers are computed from `todayIso` (no
 * fetch) so it renders instantly as the Suspense fallback. The "reserved dot"
 * under a day is data-driven (`bookedDayKeys`) and is filled by WeekStripSection
 * once the class list streams in — the fallback passes an empty set, so the
 * strip is fully navigable immediately and the dots pop in a moment later.
 */

import Link from "next/link";

const DAY_ABBR = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

/** Stable day key (YYYY-MM-DD) — shared with WeekStripSection so the booked-day
 *  set and the rendered days match exactly. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function WeekStrip({
  selectedIso,
  todayIso,
  bookedDayKeys,
}: {
  selectedIso: string;
  todayIso: string;
  /** formatDateParam() keys of days where the athlete has an active booking. */
  bookedDayKeys: Set<string>;
}) {
  const today = new Date(todayIso);
  const selected = new Date(selectedIso);
  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <div
      data-tour="reservar.week-strip"
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
        const isBooked = bookedDayKeys.has(dayKey(d));
        return (
          <Link
            key={d.toISOString()}
            href={
              {
                pathname: "/atleta/reservar",
                query: { date: dayKey(d) },
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
                  ? "1px dashed var(--k-t2)"
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
                color: isSel ? "var(--k-t2)" : "var(--k-t1)",
                lineHeight: 1,
              }}
            >
              {d.getDate()}
            </span>
            {isBooked ? (
              <span
                aria-label="Tienes una reserva este día"
                style={{
                  position: "absolute",
                  bottom: 8,
                  width: 5,
                  height: 5,
                  borderRadius: 999,
                  background: "var(--k-accent)",
                  boxShadow: "var(--k-accent-glow)",
                }}
              />
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
