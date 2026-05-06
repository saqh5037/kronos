import { listClassesInRange, type ClassRow } from "@/server/actions/classes";
import { getClassRoster, type ClassRoster } from "@/server/actions/bookings";
import { addDays, formatTime } from "@/lib/week";
import Eyebrow from "@/components/kronos/Eyebrow";
import { ScheduleNav } from "@/app/admin/programacion/_components/ScheduleNav";
import { ScheduleViewSwitch } from "@/app/admin/programacion/_components/ScheduleViewSwitch";
import { ReservasView } from "./_components/ReservasView";

export const metadata = { title: "Kronos — Reservas" };

type View = "day" | "week";
type SearchParams = {
  view?: string;
  date?: string;
  classId?: string;
};

function parseView(v: string | undefined): View {
  return v === "week" ? "week" : "day";
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

export default async function ReservasPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const view = parseView(sp.view);
  const anchor = parseDate(sp.date);

  let from: Date;
  let to: Date;
  if (view === "week") {
    from = new Date(anchor);
    from.setHours(0, 0, 0, 0);
    to = addDays(from, 6);
    to.setHours(23, 59, 59, 999);
  } else {
    from = new Date(anchor);
    from.setHours(0, 0, 0, 0);
    to = new Date(anchor);
    to.setHours(23, 59, 59, 999);
  }

  let classes: ClassRow[] = [];
  let selectedRoster: ClassRoster | null = null;

  try {
    classes = await listClassesInRange(from, to);
    const sorted = [...classes].sort(
      (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
    );
    const targetId =
      sp.classId && classes.find((c) => c.id === sp.classId)
        ? sp.classId
        : sorted[0]?.id;
    if (targetId) {
      selectedRoster = await getClassRoster(targetId);
    }
  } catch {
    // BD/sesión ausentes
  }

  const sortedClasses = [...classes].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Eyebrow>Operación</Eyebrow>
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span
            className="font-script text-[26px] leading-none"
            style={{ color: "var(--red)" }}
          >
            Roster de
          </span>
          <h1
            className="k-h-italic font-display font-extrabold text-[38px] leading-[1] tracking-[-0.02em]"
            style={{ color: "var(--text)" }}
          >
            <em>reservas</em>
          </h1>
        </div>
      </div>

      {/* Filter bar */}
      <div
        className="sticky top-0 z-10 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3 mb-4 backdrop-blur-md flex items-center justify-between gap-3 flex-wrap"
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <ScheduleNav view={view} date={anchor} basePath="/admin/reservas" />
        <ScheduleViewSwitch
          view={view as "day" | "week" | "month"}
          date={anchor}
          basePath="/admin/reservas"
        />
      </div>

      {sortedClasses.length === 0 ? (
        <div className="k-card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            No hay clases programadas en este rango.
          </p>
        </div>
      ) : (
        <ReservasView
          classes={sortedClasses.map((c) => ({
            id: c.id,
            startsAt: c.startsAt.toISOString(),
            kind: c.kind,
            wodName: c.wod?.name ?? null,
            coachName: c.coach?.name ?? null,
            bookingCount: c.bookingCount,
            capacity: c.capacity,
            timeLabel: formatTime(c.startsAt),
          }))}
          roster={
            selectedRoster
              ? {
                  ...selectedRoster,
                  startsAt: selectedRoster.startsAt.toISOString(),
                  bookings: selectedRoster.bookings.map((b) => ({
                    ...b,
                    bookedAt: b.bookedAt.toISOString(),
                    checkedInAt: b.checkedInAt
                      ? b.checkedInAt.toISOString()
                      : null,
                  })),
                }
              : null
          }
          view={view}
          date={anchor}
        />
      )}
    </div>
  );
}
