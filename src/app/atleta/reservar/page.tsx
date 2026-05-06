import {
  listAvailableClasses,
  type AvailableClass,
} from "@/server/actions/bookings";
import { formatDayMonth } from "@/lib/week";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import Eyebrow from "@/components/kronos/Eyebrow";
import { ClassesList } from "./_components/ClassesList";

export const metadata = { title: "Kronos — Reservar" };

export default async function ReservarPage() {
  let classes: AvailableClass[] = [];
  try {
    classes = await listAvailableClasses(7);
  } catch {
    // Sesión ausente
  }

  const byDay = new Map<string, AvailableClass[]>();
  for (const c of classes) {
    const key = c.startsAt.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(c);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
  const dayLabels = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

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

    return {
      active: isToday,
      booked: !!myBooking,
      off: !hasClasses,
    };
  }

  const todayKey = today.toISOString().slice(0, 10);
  const todayClasses = byDay.get(todayKey) ?? [];
  const todayBookedCount = todayClasses.filter(
    (c) => c.myBookingStatus === "BOOKED",
  ).length;

  return (
    <div className="pb-28 relative">
      {/* HERO v2.0 */}
      <header className="relative px-4 pt-14 pb-5 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 0% 0%, rgba(230,0,38,0.06), transparent 60%), radial-gradient(ellipse at 100% 100%, rgba(0,191,255,0.06), transparent 60%)",
          }}
        />
        <span className="k-corner-tl" aria-hidden />
        <span className="k-corner-br" aria-hidden />

        <AnimatedSection className="relative flex items-start justify-between">
          <AnimatedItem className="flex-1 min-w-0">
            <Eyebrow withBar color="blue">
              SEMANA · {formatDayMonth(weekDays[0]).toUpperCase()} —{" "}
              {formatDayMonth(weekDays[6]).toUpperCase()}
            </Eyebrow>
            <div className="mt-2 flex items-baseline gap-2 flex-wrap">
              <span
                className="font-script text-[26px] leading-none"
                style={{ color: "var(--red)" }}
              >
                Tu próxima
              </span>
              <h1
                className="k-h-italic font-display font-extrabold text-[32px] leading-[1] tracking-[-0.02em]"
                style={{ color: "var(--text)" }}
              >
                <em>clase</em>
              </h1>
            </div>
          </AnimatedItem>
          <AnimatedItem>
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center k-glass"
              aria-label="Filtrar"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18M6 12h12M10 18h4" />
              </svg>
            </button>
          </AnimatedItem>
        </AnimatedSection>
      </header>

      {/* WEEK SCROLL */}
      <AnimatedSection className="px-3.5 pb-4">
        <div
          className="flex gap-2 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {weekDays.map((d, i) => {
            const { active, booked, off } = getDayState(d);
            return (
              <AnimatedItem key={i}>
                <div
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 py-3 px-2 rounded-[16px] min-w-[52px] transition-all"
                  style={{
                    background: active ? "var(--grad)" : "var(--card)",
                    border: active ? "none" : "1px solid var(--line)",
                    opacity: off ? 0.45 : 1,
                    cursor: "pointer",
                    boxShadow: active
                      ? "0 4px 16px rgba(25,240,139,0.25)"
                      : "var(--card-glow)",
                    transform: active ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  <div
                    className="font-mono text-[9px] font-bold tracking-[0.1em]"
                    style={{
                      color: active ? "#1c1917" : "var(--text-3)",
                    }}
                  >
                    {dayLabels[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                  </div>
                  <div
                    className="font-display text-lg font-bold"
                    style={{
                      color: active ? "#1c1917" : "var(--text)",
                    }}
                  >
                    {d.getDate()}
                  </div>
                  {booked && (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: active ? "#1c1917" : "var(--recovery)",
                        boxShadow: !active
                          ? "0 0 6px rgba(25,240,139,0.5)"
                          : "none",
                      }}
                    />
                  )}
                  {!booked && <div className="h-1.5" />}
                </div>
              </AnimatedItem>
            );
          })}
        </div>
      </AnimatedSection>

      {/* DAY HEADER */}
      <div className="flex items-baseline justify-between px-[18px] pb-3">
        <div className="k-eyebrow" style={{ color: "var(--text-2)" }}>
          HOY · {formatDayMonth(today).toUpperCase()} · {todayClasses.length}{" "}
          CLASE{todayClasses.length !== 1 ? "S" : ""}
        </div>
        <div
          className="font-mono text-[10px] font-bold"
          style={{ color: "var(--recovery)" }}
        >
          {todayBookedCount} RESERVADA{todayBookedCount !== 1 ? "S" : ""}
        </div>
      </div>

      {/* CLASSES LIST WITH FILTERS */}
      <ClassesList classes={classes} />
    </div>
  );
}
