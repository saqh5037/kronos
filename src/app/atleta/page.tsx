import Link from "next/link";
import type { Route } from "next";
import {
  getAthleteHome,
  type AthleteHome,
} from "@/server/actions/athlete-home";
import {
  listAvailableClasses,
  type AvailableClass,
} from "@/server/actions/bookings";
import { listMyPRs, type PRRow } from "@/server/actions/prs";
import {
  getTodayWOD,
  listScoresForWOD,
  type TodayWOD,
} from "@/server/actions/scores";
import { AnimatedStats } from "@/components/kronos/AnimatedStats";
import CancelMyBookingButton from "@/components/kronos/CancelMyBookingButton";
import { formatScore } from "@/lib/scores";
import { formatDayMonth, formatTime } from "@/lib/week";
import type { ScoreType } from "@/lib/validations/wod";

export const metadata = { title: "Kronos — Inicio" };

export default async function AtletaHomePage() {
  let home: AthleteHome = null;
  let classes: AvailableClass[] = [];
  let prs: PRRow[] = [];
  let wod: TodayWOD = null;
  let wodScores: Awaited<ReturnType<typeof listScoresForWOD>> = [];

  try {
    [home, classes, prs, wod] = await Promise.all([
      getAthleteHome(),
      listAvailableClasses(7),
      listMyPRs(),
      getTodayWOD(),
    ]);
  } catch {
    // Sesión ausente
  }

  if (wod) {
    try {
      wodScores = await listScoresForWOD(wod.wodId);
    } catch {
      // ignore
    }
  }

  if (!home) {
    return (
      <div className="p-4 pt-16">
        <p className="k-eyebrow mb-2">App del atleta</p>
        <h1 className="font-display font-bold text-3xl">Inicio</h1>
        <div
          className="mt-6 p-6 rounded-xl border text-center"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            No tienes perfil de atleta vinculado. Contacta al coach del box.
          </p>
        </div>
      </div>
    );
  }

  // Enrich next booking with class capacity info
  const nextClassDetail = home.nextBooking
    ? classes.find((c) => c.id === home.nextBooking!.classId)
    : null;

  // Week strip data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
  const dayLetters = ["L", "M", "X", "J", "V", "S", "D"];

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

  // Top 4 recent scores for today's WOD leaderboard
  const topScores = wodScores.slice(0, 4);

  // Latest PR for shortcut
  const latestPR = prs[0] ?? null;

  return (
    <div className="pb-24">
      {/* HEADER */}
      <div className="flex items-center justify-between px-[18px] pt-14 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center font-extrabold text-sm text-[#0a1a14] font-display"
            style={{ background: "var(--grad)" }}
          >
            K
          </div>
          <div>
            <div
              className="font-mono text-[9px] tracking-[0.14em] font-bold"
              style={{ color: "var(--text-3)" }}
            >
              BOX
            </div>
            <div className="text-[13px] font-bold">
              Hola, {home.athlete?.firstName}
            </div>
          </div>
        </div>
        <button
          className="relative w-[34px] h-[34px] rounded-full flex items-center justify-center"
          style={{
            background: "var(--card)",
            border: "1px solid var(--line)",
          }}
          aria-label="Notificaciones"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <span
            className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--pr)" }}
          />
        </button>
      </div>

      {/* HERO STATS — animated HaloRings */}
      <AnimatedStats
        weekAttendance={home.weekAttendance}
        weekGoal={home.weekGoal}
        streak={home.streak}
        prCount={home.prCount}
      />

      {/* NEXT BOOKING */}
      <section className="mt-4 px-3.5">
        {home.nextBooking ? (
          <div className="k-card p-3.5 flex items-center gap-3.5">
            <div
              className="text-center px-2.5 py-1.5 rounded-[10px] min-w-[54px]"
              style={{ background: "var(--bg-soft)" }}
            >
              <div
                className="font-mono text-[9px] tracking-[0.1em] font-bold"
                style={{ color: "var(--text-3)" }}
              >
                {home.nextBooking.startsAt.toDateString() ===
                new Date().toDateString()
                  ? "HOY"
                  : formatDayMonth(home.nextBooking.startsAt).toUpperCase()}
              </div>
              <div
                className="font-display text-xl font-bold"
                style={{ color: "var(--recovery)" }}
              >
                {formatTime(home.nextBooking.startsAt)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold mb-0.5">
                Tu próxima clase
              </div>
              <div
                className="text-[11px] flex gap-2 items-center flex-wrap"
                style={{ color: "var(--text-2)" }}
              >
                {home.nextBooking.coachName && (
                  <span>Coach {home.nextBooking.coachName}</span>
                )}
                {nextClassDetail && (
                  <>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ color: "var(--recovery)" }}>
                      ● {nextClassDetail.bookedCount}/{nextClassDetail.capacity}
                    </span>
                  </>
                )}
              </div>
            </div>
            <CancelMyBookingButton bookingId={home.nextBooking.bookingId} />
          </div>
        ) : (
          <Link
            href="/atleta/reservar"
            className="block p-4 rounded-xl border text-center"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              Sin reservas activas. Toca para reservar.
            </p>
          </Link>
        )}
      </section>

      {/* WEEK STRIP */}
      <section className="mt-5">
        <div className="flex items-baseline justify-between px-[18px] pb-2">
          <div className="k-eyebrow" style={{ color: "var(--text-2)" }}>
            ESTA SEMANA
          </div>
          <div
            className="font-mono text-[10px] font-bold tracking-[0.08em]"
            style={{ color: "var(--recovery)" }}
          >
            {weekAttendedText}
          </div>
        </div>
        <div className="px-3.5">
          <div className="k-card p-4">
            <div className="flex justify-between gap-1.5">
              {weekDays.map((d, i) => {
                const { state, hour } = getDayState(d);
                const isToday = state === "today";
                const booked = state === "booked";
                const rest = state === "rest";
                const dayNum = d.getDate();
                const label = dayLetters[d.getDay() === 0 ? 6 : d.getDay() - 1];

                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="font-mono text-[9px] tracking-[0.1em] font-bold"
                      style={{ color: "var(--text-3)" }}
                    >
                      {label}
                    </div>
                    <div
                      className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[13px] font-bold"
                      style={{
                        background: isToday
                          ? "var(--grad)"
                          : booked
                            ? "rgba(58,163,255,0.18)"
                            : "transparent",
                        border: isToday
                          ? "none"
                          : booked
                            ? "1px solid rgba(58,163,255,0.35)"
                            : "1px solid var(--line)",
                        color: isToday
                          ? "#0a1a14"
                          : booked
                            ? "var(--strain)"
                            : rest
                              ? "var(--text-3)"
                              : "var(--text-2)",
                      }}
                    >
                      {rest ? "·" : dayNum}
                    </div>
                    <div
                      className="font-mono text-[8px] font-bold h-2.5"
                      style={{
                        color: isToday
                          ? "#fff"
                          : booked
                            ? "var(--strain)"
                            : "var(--text-3)",
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
      </section>

      {/* LEADERBOARD WOD HOY */}
      {topScores.length > 0 && wod && (
        <section className="mt-5">
          <div className="flex items-baseline justify-between px-[18px] pb-2">
            <div className="k-eyebrow" style={{ color: "var(--text-2)" }}>
              LEADERBOARD · {wod.wodName.toUpperCase()} HOY
            </div>
            <Link
              href="/atleta/wod"
              className="font-mono text-[10px] font-bold tracking-[0.08em]"
              style={{ color: "var(--text-3)" }}
            >
              VER TODOS →
            </Link>
          </div>
          <div className="px-3.5">
            <div className="k-card">
              {topScores.map((s, i, a) => {
                const isMe = false; // TODO: compare athlete id with session
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom:
                        i < a.length - 1 ? "1px solid var(--line)" : "none",
                      background: isMe ? "var(--grad-soft)" : "transparent",
                    }}
                  >
                    <div
                      className="font-display text-lg font-bold w-5"
                      style={{
                        color: i < 3 ? "var(--recovery)" : "var(--text-3)",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div
                      className="w-7 h-7 rounded-full"
                      style={{
                        background: "var(--bg-soft)",
                        border: "1px solid var(--line)",
                      }}
                    />
                    <div className="flex-1 text-[13px] font-medium">
                      {s.athlete.firstName} {s.athlete.lastName?.[0]}.
                    </div>
                    <span
                      className={`k-chip ${s.scaling === "RX" ? "k-chip-recovery" : "k-chip-ghost"}`}
                      style={{ padding: "3px 8px", fontSize: 9 }}
                    >
                      {s.scaling}
                    </span>
                    <div
                      className="font-display text-sm font-bold min-w-[54px] text-right"
                      style={{ color: isMe ? "var(--recovery)" : "#fff" }}
                    >
                      {formatScore(
                        Number(s.value),
                        s.wod.scoreType as ScoreType,
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* LAST SCORE */}
      {home.lastScore && (
        <section className="mt-4 px-3.5">
          <div className="k-card p-3.5 flex items-center gap-3.5">
            <div
              className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center"
              style={{
                background: "rgba(255,94,94,0.15)",
                border: "1px solid rgba(255,94,94,0.25)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--pr)"
                strokeWidth="2"
              >
                <path d="M6 9V5h12v4M5 9h14v4H5zM7 13l1 8h8l1-8" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-[13px] font-semibold">
                  {home.lastScore.wodName}
                </span>
              </div>
              <div
                className="font-mono text-[10px] tracking-[0.06em]"
                style={{ color: "var(--text-2)" }}
              >
                {formatScore(
                  home.lastScore.value,
                  home.lastScore.scoreType as ScoreType,
                )}{" "}
                · {formatDayMonth(home.lastScore.createdAt).toUpperCase()}
              </div>
            </div>
            <Link
              href="/atleta/perfil"
              className="text-lg opacity-40 hover:opacity-70 transition-opacity"
            >
              ›
            </Link>
          </div>
        </section>
      )}

      {/* PR SHORTCUT */}
      {latestPR && (
        <section className="mt-4 px-3.5">
          <div className="k-card p-3.5 flex items-center gap-3.5">
            <div
              className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center"
              style={{
                background: "rgba(255,94,94,0.15)",
                border: "1px solid rgba(255,94,94,0.25)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--pr)"
                strokeWidth="2"
              >
                <path d="M6 9V5h12v4M5 9h14v4H5zM7 13l1 8h8l1-8" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-[13px] font-semibold">
                  {latestPR.movementName}
                </span>
                <span
                  className="k-chip k-chip-pr"
                  style={{ padding: "2px 6px", fontSize: 9 }}
                >
                  PR
                </span>
              </div>
              <div
                className="font-mono text-[10px] tracking-[0.06em]"
                style={{ color: "var(--text-2)" }}
              >
                {latestPR.value} {latestPR.unit} ·{" "}
                {formatDayMonth(latestPR.achievedAt).toUpperCase()}
              </div>
            </div>
            <Link
              href="/atleta/perfil"
              className="text-lg opacity-40 hover:opacity-70 transition-opacity"
            >
              ›
            </Link>
          </div>
        </section>
      )}

      {/* QUICK LINKS */}
      <section className="mt-6 px-4 grid grid-cols-2 gap-3">
        <QuickLink href="/atleta/wod" label="WOD del día" tone="strain" />
        <QuickLink href="/atleta/reservar" label="Reservar" tone="recovery" />
        <QuickLink href="/atleta/perfil" label="Mi perfil" tone="ghost" />
        <QuickLink href="/atleta/wod" label="Subir score" tone="ghost" />
      </section>
    </div>
  );
}

function QuickLink({
  href,
  label,
  tone,
}: {
  href: string;
  label: string;
  tone: "recovery" | "strain" | "ghost";
}) {
  const color =
    tone === "recovery"
      ? "var(--recovery)"
      : tone === "strain"
        ? "var(--strain)"
        : "var(--text-2)";
  return (
    <Link
      href={href as Route}
      className="k-card p-4 flex items-center justify-center text-center text-sm font-display font-semibold transition-colors hover:brightness-110"
      style={{ color }}
    >
      {label}
    </Link>
  );
}
