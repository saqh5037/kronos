import {
  listAvailableClasses,
  getAthleteUsualSlots,
  type AvailableClass,
  type UsualSlot,
} from "@/server/actions/bookings";
import { formatDayMonth, startOfWeek, addDays } from "@/lib/week";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import Eyebrow from "@/components/kronos/Eyebrow";
import { ClassesList } from "./_components/ClassesList";
import { ScheduleViewSwitch } from "@/app/admin/programacion/_components/ScheduleViewSwitch";
import { ScheduleNav } from "@/app/admin/programacion/_components/ScheduleNav";
import { MonthGrid } from "./_components/MonthGrid";

export const metadata = { title: "Kronos — Reservar" };

type View = "day" | "week" | "month";
type SearchParams = { view?: string; date?: string };

function parseView(v: string | undefined): View {
  if (v === "day" || v === "month") return v;
  return "week";
}
function parseDate(s: string | undefined): Date {
  if (s) {
    const [y, m, d] = s.split("-").map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

export default async function ReservarPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const view = parseView(sp.view);
  const anchor = parseDate(sp.date);

  let from: Date;
  let daysAhead: number;
  if (view === "day") {
    from = new Date(anchor);
    from.setHours(0, 0, 0, 0);
    daysAhead = 1;
  } else if (view === "month") {
    from = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const lastDay = new Date(
      anchor.getFullYear(),
      anchor.getMonth() + 1,
      0,
    ).getDate();
    daysAhead = lastDay;
  } else {
    from = startOfWeek(anchor);
    daysAhead = 7;
  }

  let classes: AvailableClass[] = [];
  let usual: UsualSlot[] = [];
  try {
    [classes, usual] = await Promise.all([
      listAvailableClasses(daysAhead, from),
      getAthleteUsualSlots(60),
    ]);
  } catch {
    // Sesión ausente
  }

  const todayClasses = classes.filter((c) => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const e = new Date(t);
    e.setHours(23, 59, 59, 999);
    return c.startsAt >= t && c.startsAt <= e;
  });
  const todayBookedCount = todayClasses.filter(
    (c) => c.myBookingStatus === "BOOKED",
  ).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const usualLabel = usual.length
    ? usual
        .slice(0, 2)
        .map((s) => `${String(s.hour).padStart(2, "0")}:00`)
        .join(" · ")
    : null;

  return (
    <div className="pb-28 relative">
      <header className="relative px-4 pt-10 pb-3 overflow-hidden">
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

        <AnimatedSection className="relative">
          <AnimatedItem>
            <Eyebrow withBar color="blue">
              RESERVAR
            </Eyebrow>
            <div className="mt-2 flex items-baseline gap-2 flex-wrap">
              <span
                className="font-script text-[24px] leading-none"
                style={{ color: "var(--red)" }}
              >
                Tu próxima
              </span>
              <h1
                className="k-h-italic font-display font-extrabold text-[28px] leading-[1] tracking-[-0.02em]"
                style={{ color: "var(--text)" }}
              >
                <em>clase</em>
              </h1>
            </div>
            {usualLabel && (
              <p
                className="font-mono text-[10px] mt-2 font-bold tracking-wider uppercase"
                style={{ color: "var(--cyan)" }}
              >
                Tu horario habitual · {usualLabel}
              </p>
            )}
          </AnimatedItem>
        </AnimatedSection>
      </header>

      {/* Sticky filter bar */}
      <div
        className="sticky top-0 z-20 px-3 py-2.5 backdrop-blur-md flex items-center justify-between gap-2 flex-wrap"
        style={{
          background: "rgba(10,10,12,0.85)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <ScheduleNav view={view} date={anchor} basePath="/atleta/reservar" />
        <ScheduleViewSwitch
          view={view}
          date={anchor}
          basePath="/atleta/reservar"
        />
      </div>

      {todayClasses.length > 0 && view !== "month" && (
        <div className="flex items-baseline justify-between px-[18px] pb-2 pt-3">
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
      )}

      {view === "month" ? (
        <div className="px-3 pt-3">
          <MonthGrid monthAnchor={anchor} classes={classes} />
        </div>
      ) : (
        <ClassesList classes={classes} usualHours={usual.map((s) => s.hour)} />
      )}
    </div>
  );
}

void formatDayMonth;
void addDays;
