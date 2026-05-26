/**
 * WeekStripSection — streams the 7-day week calendar strip.
 *
 * Uses both getAthleteHomeCached() and listAvailableClassesCached() so the
 * fetches dedup with BookingSection (same request, same React.cache key).
 *
 * getDayState() is pure — moved inline to avoid exporting non-RSC logic.
 * The `today` variable is computed on the server (stable, no hydration risk).
 */

import {
  getAthleteHomeCached,
  listAvailableClassesCached,
} from "../request-cache";
import RevealOnScroll from "@/components/kronos/RevealOnScroll";
import { formatTime } from "@/lib/week";

const DAY_LETTERS = ["L", "M", "X", "J", "V", "S", "D"] as const;

export async function WeekStripSection() {
  const [home, classes] = await Promise.all([
    getAthleteHomeCached(),
    listAvailableClassesCached(),
  ]);

  if (!home) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  function getDayState(date: Date) {
    const isToday = date.getTime() === today.getTime();
    const key = date.toISOString().slice(0, 10);
    const dayClasses = classes.filter(
      (c) => c.startsAt.toISOString().slice(0, 10) === key,
    );
    const myBooking = dayClasses.find(
      (c) => c.myBookingStatus === "BOOKED" || c.myBookingStatus === "WAITLIST",
    );
    const hasClasses = dayClasses.length > 0;
    if (isToday)
      return {
        state: "today" as const,
        hour: myBooking ? formatTime(myBooking.startsAt) : undefined,
      };
    if (myBooking)
      return { state: "booked" as const, hour: formatTime(myBooking.startsAt) };
    if (hasClasses) return { state: "free" as const };
    return { state: "rest" as const };
  }

  const weekAttendedText = `${home.weekAttendance}/${home.weekGoal} ASISTENCIAS`;

  return (
    <RevealOnScroll
      data-tour="home.week-strip"
      variant="fade-up"
      className="mt-5"
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          padding: "0 18px 8px",
        }}
      >
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
          Esta semana
        </span>
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "var(--k-t2)",
          }}
        >
          {weekAttendedText}
        </div>
      </div>
      <div className="px-3.5">
        <div
          style={{
            padding: 16,
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            borderRadius: 16,
          }}
        >
          <div className="flex justify-between gap-1.5">
            {weekDays.map((d, i) => {
              const { state, hour } = getDayState(d);
              const isToday = state === "today";
              const booked = state === "booked";
              const rest = state === "rest";
              const dayNum = d.getDate();
              const label = DAY_LETTERS[d.getDay() === 0 ? 6 : d.getDay() - 1];

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1.5"
                >
                  <div
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      color: "var(--k-t3)",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--k-font-display)",
                      fontSize: 13,
                      fontWeight: 700,
                      transition: "all 200ms ease",
                      background: isToday
                        ? "var(--k-t2)"
                        : booked
                          ? "var(--k-elevated)"
                          : "transparent",
                      border: isToday ? "none" : "1px solid var(--k-line)",
                      color: isToday
                        ? "var(--k-bg)"
                        : booked
                          ? "var(--k-t2)"
                          : rest
                            ? "var(--k-t3)"
                            : "var(--k-t2)",
                      boxShadow: isToday
                        ? "0 0 8px rgba(255,255,255,0.06)"
                        : "none",
                    }}
                  >
                    {rest ? "·" : dayNum}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      height: 10,
                      color: isToday
                        ? "var(--k-t1)"
                        : booked
                          ? "var(--k-t2)"
                          : "var(--k-t3)",
                    }}
                  >
                    {isToday ? "HOY" : booked ? hour : rest ? "OFF" : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </RevealOnScroll>
  );
}
