import { notFound } from "next/navigation";
import {
  getTVDisplay,
  type TVDisplay,
  type TVClass,
  type TVWOD,
  type TVLeader,
  type TVPRRow,
} from "@/server/actions/tv";
import { formatTime, formatDayMonth } from "@/lib/week";

export const metadata = { title: "Kronos — Pantalla del box" };

// Refresh data every 30 seconds when the TV is left running
export const revalidate = 30;

export default async function TVDisplayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data: TVDisplay = await getTVDisplay(slug);
  if (!data) notFound();

  return (
    <main
      className="min-h-screen p-8 flex flex-col gap-6"
      style={{ background: "var(--bg)" }}
    >
      <Header boxName={data.box.name} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <NowPlaying
            current={data.currentClass}
            next={data.upcomingClasses[0] ?? null}
          />
          <TodaysWOD wod={data.todaysWOD} />
        </div>

        <div className="flex flex-col gap-6">
          <UpcomingList classes={data.upcomingClasses} />
          <WeekLeaders leaders={data.weekLeaders} />
          <RecentPRs prs={data.recentPRs} />
        </div>
      </div>
    </main>
  );
}

function Header({ boxName }: { boxName: string }) {
  const now = new Date();
  return (
    <header
      className="flex items-end justify-between border-b pb-4"
      style={{ borderColor: "var(--line)" }}
    >
      <div>
        <p className="k-eyebrow" style={{ color: "var(--text-2)" }}>
          {boxName}
        </p>
        <h1
          className="font-display font-bold text-5xl tracking-tight mt-1"
          style={{
            background: "var(--grad)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          KRONOS
        </h1>
      </div>
      <div className="text-right">
        <p
          className="font-mono font-bold text-7xl"
          style={{ color: "var(--text)" }}
        >
          {formatTime(now)}
        </p>
        <p
          className="k-eyebrow mt-1 capitalize"
          style={{ color: "var(--text-3)" }}
        >
          {now.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>
    </header>
  );
}

function NowPlaying({
  current,
  next,
}: {
  current: TVClass | null;
  next: TVClass | null;
}) {
  if (current) {
    const fillRatio = current.bookedCount / current.capacity;
    const tone =
      fillRatio >= 1
        ? "var(--pr)"
        : fillRatio >= 0.7
          ? "var(--strain)"
          : "var(--recovery)";
    return (
      <section
        className="p-8 rounded-2xl border"
        style={{
          borderColor: "var(--moss)",
          background: "var(--card)",
        }}
      >
        <p className="k-eyebrow" style={{ color: "var(--moss)" }}>
          ● EN VIVO · {formatTime(current.startsAt)} · {current.durationMin}min
        </p>
        <h2 className="font-display font-bold text-5xl mt-2 tracking-tight">
          {current.wodName ?? "Clase en curso"}
        </h2>
        <div className="flex items-end gap-6 mt-4">
          <div>
            <p className="k-eyebrow" style={{ color: "var(--text-3)" }}>
              Asistidos
            </p>
            <p
              className="font-mono font-bold text-4xl mt-1"
              style={{ color: "var(--moss)" }}
            >
              {current.attendedCount}
              <span className="text-2xl" style={{ color: "var(--text-3)" }}>
                /{current.capacity}
              </span>
            </p>
          </div>
          <div>
            <p className="k-eyebrow" style={{ color: "var(--text-3)" }}>
              Reservados
            </p>
            <p
              className="font-mono font-bold text-4xl mt-1"
              style={{ color: tone }}
            >
              {current.bookedCount}
            </p>
          </div>
          {current.coachName && (
            <div className="ml-auto text-right">
              <p className="k-eyebrow" style={{ color: "var(--text-3)" }}>
                Coach
              </p>
              <p className="font-display font-semibold text-2xl mt-1">
                {current.coachName}
              </p>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (next) {
    const minutesUntil = Math.round(
      (next.startsAt.getTime() - Date.now()) / 60000,
    );
    return (
      <section
        className="p-8 rounded-2xl border"
        style={{
          borderColor: "var(--steel)",
          background: "var(--card)",
        }}
      >
        <p className="k-eyebrow" style={{ color: "var(--steel)" }}>
          PRÓXIMA · en {minutesUntil}min · {formatTime(next.startsAt)}
        </p>
        <h2 className="font-display font-bold text-5xl mt-2 tracking-tight">
          {next.wodName ?? "Por definir"}
        </h2>
        {next.coachName && (
          <p className="k-eyebrow mt-3" style={{ color: "var(--text-3)" }}>
            Coach {next.coachName}
          </p>
        )}
      </section>
    );
  }

  return (
    <section
      className="p-8 rounded-2xl border text-center"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <h2 className="font-display text-3xl" style={{ color: "var(--text-2)" }}>
        Sin clases programadas para hoy
      </h2>
    </section>
  );
}

function TodaysWOD({ wod }: { wod: TVWOD | null }) {
  if (!wod) return null;
  return (
    <section
      className="p-6 rounded-2xl border flex-1"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <div className="flex items-center justify-between">
        <p className="k-eyebrow" style={{ color: "var(--text-2)" }}>
          WOD del día
        </p>
        <div className="flex gap-2">
          <span className="k-chip k-chip-steel">{wod.type}</span>
          <span className="k-chip k-chip-ghost">{wod.scoreType}</span>
          {wod.timeCap && (
            <span className="k-chip k-chip-ember">{wod.timeCap}min cap</span>
          )}
        </div>
      </div>
      <h3 className="font-display font-bold text-4xl mt-2">{wod.name}</h3>
      {wod.description && (
        <p
          className="text-base mt-3 whitespace-pre-line"
          style={{ color: "var(--text-2)" }}
        >
          {wod.description}
        </p>
      )}
      {wod.movements.length > 0 && (
        <ul
          className="mt-4 grid grid-cols-2 gap-2 border-t pt-3"
          style={{ borderColor: "var(--line)" }}
        >
          {wod.movements.map((m, i) => (
            <li
              key={`${m.name}-${i}`}
              className="flex items-center justify-between text-base"
            >
              <span>
                {m.reps && (
                  <span
                    className="font-mono font-bold mr-2"
                    style={{ color: "var(--steel)" }}
                  >
                    {m.reps}
                  </span>
                )}
                {m.name}
              </span>
              {m.weight && (
                <span
                  className="font-mono text-sm"
                  style={{ color: "var(--text-3)" }}
                >
                  {m.weight}kg
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function UpcomingList({ classes }: { classes: TVClass[] }) {
  return (
    <section
      className="p-5 rounded-2xl border"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <p className="k-eyebrow mb-3" style={{ color: "var(--text-2)" }}>
        Hoy más tarde
      </p>
      {classes.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          No hay más clases hoy.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {classes.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="min-w-0">
                <p className="font-mono font-bold text-lg">
                  {formatTime(c.startsAt)}
                </p>
                <p
                  className="text-sm truncate"
                  style={{ color: "var(--text-2)" }}
                >
                  {c.wodName ?? "Por definir"}
                </p>
              </div>
              <span
                className={`k-chip ${
                  c.bookedCount >= c.capacity
                    ? "k-chip-ember"
                    : c.bookedCount / c.capacity >= 0.7
                      ? "k-chip-steel"
                      : "k-chip-moss"
                } text-xs`}
              >
                {c.bookedCount}/{c.capacity}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function WeekLeaders({ leaders }: { leaders: TVLeader[] }) {
  return (
    <section
      className="p-5 rounded-2xl border"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <p className="k-eyebrow mb-3" style={{ color: "var(--text-2)" }}>
        Top de la semana
      </p>
      {leaders.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Aún sin asistencias esta semana.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {leaders.map((l, idx) => (
            <li
              key={l.athleteName}
              className="flex items-center justify-between gap-3 py-1.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="font-mono font-bold text-lg w-6"
                  style={{
                    color:
                      idx === 0
                        ? "var(--recovery)"
                        : idx < 3
                          ? "var(--strain)"
                          : "var(--text-3)",
                  }}
                >
                  {idx + 1}
                </span>
                <span className="font-medium truncate">{l.athleteName}</span>
              </div>
              <span
                className="font-mono font-bold"
                style={{
                  color: idx === 0 ? "var(--recovery)" : "var(--text)",
                }}
              >
                {l.attendedCount}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentPRs({ prs }: { prs: TVPRRow[] }) {
  return (
    <section
      className="p-5 rounded-2xl border"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <p className="k-eyebrow mb-3" style={{ color: "var(--ember)" }}>
        🏆 PRs recientes
      </p>
      {prs.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Sin PRs registrados aún.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {prs.map((p, idx) => (
            <li key={`${p.athleteName}-${idx}`} className="py-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate">
                  {p.athleteName}
                </span>
                <span
                  className="font-mono font-bold text-sm"
                  style={{ color: "var(--ember)" }}
                >
                  {p.value}
                  {p.unit}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                {p.movementName} · {formatDayMonth(p.achievedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
