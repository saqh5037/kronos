import {
  listAvailableClasses,
  type AvailableClass,
} from "@/server/actions/bookings";
import { BookButton } from "@/components/BookingActions";
import { formatDayMonth, formatTime } from "@/lib/week";

export const metadata = { title: "Kronos — Reservar" };

export default async function ReservarPage() {
  let classes: AvailableClass[] = [];
  try {
    classes = await listAvailableClasses(7);
  } catch {
    // Sesión ausente
  }

  // Group classes by date
  const byDay = new Map<string, AvailableClass[]>();
  for (const c of classes) {
    const key = c.startsAt.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(c);
  }

  // Week scroll data
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

  // Find "today" classes for the day header
  const todayKey = today.toISOString().slice(0, 10);
  const todayClasses = byDay.get(todayKey) ?? [];
  const todayBookedCount = todayClasses.filter(
    (c) => c.myBookingStatus === "BOOKED",
  ).length;

  return (
    <div className="pb-24">
      {/* HEADER */}
      <div className="flex items-center justify-between px-[18px] pt-14 pb-4">
        <div>
          <div className="k-eyebrow mb-1" style={{ color: "var(--text-3)" }}>
            SEMANA · {formatDayMonth(weekDays[0]).toUpperCase()} —{" "}
            {formatDayMonth(weekDays[6]).toUpperCase()}
          </div>
          <div className="font-display text-2xl font-bold">Reservar clase</div>
        </div>
        <button
          className="w-9 h-9 rounded-[10px] flex items-center justify-center"
          style={{
            background: "var(--card)",
            border: "1px solid var(--line)",
          }}
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
      </div>

      {/* WEEK SCROLL */}
      <div className="px-3.5 pb-4">
        <div
          className="flex gap-1.5 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {weekDays.map((d, i) => {
            const { active, booked, off } = getDayState(d);
            return (
              <div
                key={i}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 py-3 px-1 rounded-[14px] min-w-[46px]"
                style={{
                  background: active ? "var(--grad)" : "var(--card)",
                  border: active ? "none" : "1px solid var(--line)",
                  opacity: off ? 0.5 : 1,
                  cursor: "pointer",
                }}
              >
                <div
                  className="font-mono text-[9px] font-bold tracking-[0.1em]"
                  style={{
                    color: active ? "#0a1a14" : "var(--text-3)",
                  }}
                >
                  {dayLabels[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                </div>
                <div
                  className="font-display text-lg font-bold"
                  style={{
                    color: active ? "#0a1a14" : "#fff",
                  }}
                >
                  {d.getDate()}
                </div>
                {booked && (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--strain)" }}
                  />
                )}
                {!booked && <div className="h-1.5" />}
              </div>
            );
          })}
        </div>
      </div>

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

      {/* SLOTS LIST */}
      <div className="px-3.5 flex flex-col gap-2">
        {classes.length === 0 ? (
          <div
            className="p-6 rounded-xl border text-center"
            style={{
              borderColor: "var(--line)",
              background: "var(--card)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              No hay clases programadas. Vuelve pronto.
            </p>
          </div>
        ) : (
          Array.from(byDay.entries()).map(([dateKey, dayClasses]) => {
            const date = new Date(dateKey + "T12:00:00.000Z");
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={dateKey} className="flex flex-col gap-2">
                {!isToday && (
                  <p
                    className="font-display font-semibold text-sm px-1 pt-2"
                    style={{ color: "var(--text-2)" }}
                  >
                    {formatDayMonth(date)}
                  </p>
                )}
                {dayClasses.map((c) => (
                  <ClassRow key={c.id} c={c} />
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ClassRow({ c }: { c: AvailableClass }) {
  const full = c.bookedCount >= c.capacity;
  const fillRatio = c.bookedCount / c.capacity;
  const past = new Date(c.startsAt) < new Date();

  const barColor =
    full || fillRatio >= 0.85
      ? "var(--pr)"
      : fillRatio >= 0.6
        ? "var(--strain)"
        : "var(--recovery)";

  return (
    <div className="k-card p-3.5 relative" style={{ opacity: past ? 0.45 : 1 }}>
      <div className="flex items-center gap-3.5">
        {/* TIME */}
        <div className="min-w-[64px]">
          <div
            className="font-display text-[22px] font-bold"
            style={{
              color:
                c.myBookingStatus === "BOOKED" ? "var(--recovery)" : "#fff",
              letterSpacing: "-0.03em",
            }}
          >
            {formatTime(c.startsAt)}
          </div>
          <div
            className="font-mono text-[9px] font-bold tracking-[0.08em]"
            style={{ color: "var(--text-3)" }}
          >
            {c.durationMin} MIN
          </div>
        </div>

        {/* COACH + CAP */}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold mb-1.5 truncate">
            {c.wod?.name ?? "WOD por definir"}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 h-1 rounded-sm overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${Math.min(100, fillRatio * 100)}%`,
                  background: barColor,
                }}
              />
            </div>
            <div
              className="font-mono text-[10px] font-bold min-w-[40px] text-right"
              style={{ color: "var(--text-2)" }}
            >
              {c.bookedCount}/{c.capacity}
            </div>
          </div>
          <div className="text-[10px] mt-1" style={{ color: "var(--text-3)" }}>
            {c.coach?.name && `Coach ${c.coach.name}`}
            {c.coach?.name && c.wod?.type && (
              <span className="mx-1.5 opacity-40">·</span>
            )}
            {c.wod?.type}
          </div>
        </div>

        {/* ACTION */}
        <div className="flex-shrink-0">
          <BookButton
            classId={c.id}
            bookedCount={c.bookedCount}
            capacity={c.capacity}
            myStatus={c.myBookingStatus}
            myBookingId={c.myBookingId}
          />
        </div>
      </div>
    </div>
  );
}
