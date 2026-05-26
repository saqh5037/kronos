import {
  listClassesInRange,
  listCoaches,
  listWODs,
  type ClassRow,
} from "@/server/actions/classes";
import ClassForm from "@/components/ClassForm";
import {
  startOfWeek,
  addDays,
  formatWeekday,
  formatDayMonth,
} from "@/lib/week";
import Eyebrow from "@/components/kronos/Eyebrow";
import { ScheduleViewSwitch } from "./_components/ScheduleViewSwitch";
import { ScheduleNav } from "./_components/ScheduleNav";
import { DayView } from "./_components/DayView";
import { WeekView } from "./_components/WeekView";
import { MonthView } from "./_components/MonthView";

export const metadata = { title: "Kronos — Programación" };

type Coach = { id: string; name: string | null; email: string };
type WOD = { id: string; name: string; type: string };
type View = "day" | "week" | "month";

type SearchParams = {
  view?: string;
  date?: string;
};

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

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export default async function ProgramacionPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const view = parseView(sp.view);
  const date = parseDate(sp.date);

  let from: Date;
  let to: Date;
  if (view === "day") {
    from = new Date(date);
    from.setHours(0, 0, 0, 0);
    to = new Date(date);
    to.setHours(23, 59, 59, 999);
  } else if (view === "month") {
    from = startOfMonth(date);
    to = endOfMonth(date);
  } else {
    from = startOfWeek(date);
    to = addDays(from, 6);
    to.setHours(23, 59, 59, 999);
  }

  let classes: ClassRow[] = [];
  let coaches: Coach[] = [];
  let wods: WOD[] = [];

  try {
    [classes, coaches, wods] = await Promise.all([
      listClassesInRange(from, to),
      listCoaches(),
      listWODs(),
    ]);
  } catch {
    // BD ausente o sin sesión — render vacío
  }

  const headerLabel =
    view === "day"
      ? `${formatWeekday(date)} ${formatDayMonth(date)}`
      : view === "month"
        ? date.toLocaleDateString("es-MX", { month: "long", year: "numeric" })
        : `Semana del ${formatDayMonth(from)} al ${formatDayMonth(addDays(from, 6))}`;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Eyebrow>Operación</Eyebrow>
          <h1 className="k-h-italic font-display font-extrabold text-3xl lg:text-[38px] leading-[1] tracking-[-0.02em] mt-2">
            Programa<em>ción</em>
          </h1>
          <p
            className="text-sm mt-1 font-medium"
            style={{ color: "var(--k-t2)" }}
          >
            {headerLabel}
          </p>
        </div>
        <ClassForm coaches={coaches} wods={wods} />
      </div>

      {/* Filter bar */}
      <div
        className="sticky top-0 z-10 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3 mb-4 backdrop-blur-md flex items-center justify-between gap-3 flex-wrap"
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid var(--k-line)",
        }}
      >
        <ScheduleNav view={view} date={date} />
        <ScheduleViewSwitch view={view} date={date} />
      </div>

      {view === "day" && (
        <DayView date={date} classes={classes} coaches={coaches} wods={wods} />
      )}
      {view === "week" && (
        <WeekView weekStart={from} classes={classes} today={new Date()} />
      )}
      {view === "month" && <MonthView monthAnchor={date} classes={classes} />}
    </div>
  );
}
