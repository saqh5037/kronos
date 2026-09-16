import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import {
  getTVDisplay,
  type TVDisplay,
  type TVClass,
  type TVWOD,
  type TVLeader,
  type TVPRRow,
} from "@/server/actions/tv";
import { wodTypeLabel, scoreTypeLabel } from "@/lib/labels";
import { formatDateWeekday, formatTime24 } from "@/lib/format";
import {
  formatDurationMinutes,
  formatMinutesUntil,
} from "../_lib/format-countdown";
import { TvClock } from "../_components/TvClock";

export const metadata = { title: "Kronos — Pantalla del box" };

/**
 * Intensidad monocromática: el rank 1 va a full y los siguientes bajan opacidad
 * en vez de cambiar de color. Naranja y rojo quedan solo para advertencias y
 * errores reales (audit 2026-09-15).
 */
function rankOpacity(index: number): number {
  if (index === 0) return 1;
  if (index === 1) return 0.78;
  if (index === 2) return 0.6;
  return 0.42;
}

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
      style={{ background: "var(--k-bg)" }}
    >
      <Header boxName={data.box.name} brandColor={data.box.brandColor} />

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

      {/* Marca discreta: la pantalla la ve el atleta del Box, no un prospecto
          de Kronos (audit 2026-09-15). */}
      <footer
        className="k-eyebrow text-right"
        style={{ color: "var(--k-t3)", fontSize: 10 }}
      >
        Kronos
      </footer>
    </main>
  );
}

/**
 * La pantalla es del Box, no de Kronos (audit 2026-09-15). El nombre del Box es
 * el título y toma su color de marca; "Kronos" queda como marca discreta al pie.
 * Los tamaños usan clamp() para que nada se desborde a 360.
 */
function Header({
  boxName,
  brandColor,
}: {
  boxName: string;
  brandColor: string | null;
}) {
  return (
    <header
      className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b pb-4"
      style={{ borderColor: "var(--k-line)" }}
    >
      <div className="min-w-0">
        <h1
          className="font-display font-bold tracking-tight"
          style={{
            color: brandColor ?? "var(--k-accent)",
            fontSize: "clamp(28px, 6vw, 64px)",
            lineHeight: 1.02,
            overflowWrap: "anywhere",
          }}
        >
          {boxName}
        </h1>
      </div>
      <TvClock />
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
        ? "var(--k-danger)"
        : fillRatio >= 0.7
          ? "var(--k-warning)"
          : "var(--k-accent)";
    return (
      <section
        className="p-8 rounded-2xl border"
        style={{
          borderColor: "var(--k-accent)",
          background: "var(--k-surface)",
        }}
      >
        <p
          className="k-eyebrow flex items-center gap-2"
          style={{ color: "var(--k-accent)" }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--k-accent)",
              flexShrink: 0,
            }}
          />
          EN VIVO · {formatTime24(current.startsAt)} ·{" "}
          {formatDurationMinutes(current.durationMin)}
        </p>
        <h2 className="font-display font-bold text-5xl mt-2 tracking-tight">
          {current.wodName ?? "Clase en curso"}
        </h2>
        <div className="flex items-end gap-6 mt-4">
          <div>
            <p className="k-eyebrow" style={{ color: "var(--k-t3)" }}>
              Asistidos
            </p>
            <p
              className="font-mono font-bold text-4xl mt-1"
              style={{ color: "var(--k-accent)" }}
            >
              {current.attendedCount}
              <span className="text-2xl" style={{ color: "var(--k-t3)" }}>
                /{current.capacity}
              </span>
            </p>
          </div>
          <div>
            <p className="k-eyebrow" style={{ color: "var(--k-t3)" }}>
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
              <p className="k-eyebrow" style={{ color: "var(--k-t3)" }}>
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
          borderColor: "var(--k-t2)",
          background: "var(--k-surface)",
        }}
      >
        <p className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
          PRÓXIMA · {formatMinutesUntil(minutesUntil)} ·{" "}
          {formatTime24(next.startsAt)}
        </p>
        <h2 className="font-display font-bold text-5xl mt-2 tracking-tight">
          {next.wodName ?? "Por definir"}
        </h2>
        {next.coachName && (
          <p className="k-eyebrow mt-3" style={{ color: "var(--k-t3)" }}>
            Coach {next.coachName}
          </p>
        )}
      </section>
    );
  }

  return (
    <section
      className="p-8 rounded-2xl border text-center"
      style={{ borderColor: "var(--k-line)", background: "var(--k-surface)" }}
    >
      <h2 className="font-display text-3xl" style={{ color: "var(--k-t2)" }}>
        Sin clases programadas para hoy
      </h2>
    </section>
  );
}

function TodaysWOD({ wod }: { wod: TVWOD | null }) {
  if (!wod) return null;
  // Sin `flex-1`: la card se estiraba a 750 px con una sola línea adentro y
  // ~550 px de vacío (audit 2026-09-15). Ahora crece con su contenido.
  return (
    <section
      className="p-6 rounded-2xl border"
      style={{ borderColor: "var(--k-line)", background: "var(--k-surface)" }}
    >
      <div className="flex items-center justify-between">
        <p className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
          WOD del día
        </p>
        <div className="flex gap-2">
          <span className="k-chip k-chip-steel">
            {wodTypeLabel[wod.type as keyof typeof wodTypeLabel] ?? wod.type}
          </span>
          <span className="k-chip k-chip-ghost">
            {scoreTypeLabel[wod.scoreType as keyof typeof scoreTypeLabel] ??
              wod.scoreType}
          </span>
          {wod.timeCap && (
            <span className="k-chip k-chip-ember">{wod.timeCap}min cap</span>
          )}
        </div>
      </div>
      <h3 className="font-display font-bold text-4xl mt-2">{wod.name}</h3>
      {wod.description && (
        <p
          className="text-base mt-3 whitespace-pre-line"
          style={{ color: "var(--k-t2)" }}
        >
          {wod.description}
        </p>
      )}
      {wod.movements.length > 0 && (
        <ul
          className="mt-4 grid grid-cols-2 gap-2 border-t pt-3"
          style={{ borderColor: "var(--k-line)" }}
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
                    style={{ color: "var(--k-t2)" }}
                  >
                    {m.reps}
                  </span>
                )}
                {m.name}
              </span>
              {m.weight && (
                <span
                  className="font-mono text-sm"
                  style={{ color: "var(--k-t3)" }}
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
      style={{ borderColor: "var(--k-line)", background: "var(--k-surface)" }}
    >
      <p className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
        Hoy más tarde
      </p>
      {classes.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--k-t3)" }}>
          No hay más clases hoy.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {classes.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0"
              style={{ borderColor: "var(--k-line)" }}
            >
              <div className="min-w-0">
                <p className="font-mono font-bold text-lg">
                  {formatTime24(c.startsAt)}
                </p>
                <p
                  className="text-sm truncate"
                  style={{ color: "var(--k-t2)" }}
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
      style={{ borderColor: "var(--k-line)", background: "var(--k-surface)" }}
    >
      <p className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
        Top de la semana · asistencias
      </p>
      {leaders.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--k-t3)" }}>
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
                    color: "var(--k-accent)",
                    opacity: rankOpacity(idx),
                  }}
                >
                  {idx + 1}
                </span>
                <span className="font-medium truncate">{l.athleteName}</span>
              </div>
              <span
                className="font-mono font-bold"
                style={{
                  color: "var(--k-accent)",
                  opacity: rankOpacity(idx),
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
      style={{ borderColor: "var(--k-line)", background: "var(--k-surface)" }}
    >
      <p
        className="k-eyebrow mb-3 flex items-center gap-2"
        style={{ color: "var(--k-accent)" }}
      >
        <Trophy size={14} strokeWidth={2} aria-hidden="true" />
        PRs recientes
      </p>
      {prs.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--k-t3)" }}>
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
                  style={{ color: "var(--k-accent)" }}
                >
                  {p.value}
                  {p.unit}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--k-t3)" }}>
                {p.movementName} · {formatDateWeekday(p.achievedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
