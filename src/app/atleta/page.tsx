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
import {
  getActiveSurvey,
  hasRespondedToday,
  type SurveyRow,
} from "@/server/actions/surveys";
import QuickSurvey from "@/components/atleta/QuickSurvey";
import PersonalizedGreeting from "@/components/atleta/PersonalizedGreeting";
import { getDailyGreeting, type DailyGreeting } from "@/server/actions/ai";
import { AnimatedStats } from "@/components/kronos/AnimatedStats";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import ParticleMesh from "@/components/kronos/ParticleMesh";
import CancelMyBookingButton from "@/components/kronos/CancelMyBookingButton";
import { formatScore } from "@/lib/scores";
import { formatDayMonth, formatTime } from "@/lib/week";
import type { ScoreType } from "@/lib/validations/wod";

import KCard from "@/components/kronos/KCard";
import RevealOnScroll from "@/components/kronos/RevealOnScroll";
import Eyebrow from "@/components/kronos/Eyebrow";
import AuroraBackground from "@/components/kronos/AuroraBackground";

export const metadata = { title: "Kronos — Inicio" };

export default async function AtletaHomePage() {
  let home: AthleteHome = null;
  let classes: AvailableClass[] = [];
  let prs: PRRow[] = [];
  let wod: TodayWOD = null;
  let wodScores: Awaited<ReturnType<typeof listScoresForWOD>> = [];
  let readinessSurvey: SurveyRow | null = null;
  let alreadyRespondedReadiness = true;
  let greeting: DailyGreeting | null = null;

  try {
    [home, classes, prs, wod, greeting] = await Promise.all([
      getAthleteHome(),
      listAvailableClasses(7),
      listMyPRs(),
      getTodayWOD(),
      getDailyGreeting(),
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

  if (home) {
    try {
      [readinessSurvey, alreadyRespondedReadiness] = await Promise.all([
        getActiveSurvey("READINESS"),
        hasRespondedToday("READINESS"),
      ]);
    } catch {
      // Ignore
    }
  }

  if (!home) {
    return (
      <div className="p-4 pt-16">
        <Eyebrow>App del atleta</Eyebrow>
        <h1 className="font-display font-bold text-3xl mt-2">Inicio</h1>
        <div className="mt-6 k-card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            No tienes perfil de atleta vinculado. Contacta al coach del box.
          </p>
        </div>
      </div>
    );
  }

  const nextClassDetail = home.nextBooking
    ? classes.find((c) => c.id === home.nextBooking!.classId)
    : null;

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
  const topScores = wodScores.slice(0, 4);
  const latestPR = prs[0] ?? null;

  return (
    <div className="pb-28 relative">
      {/* HERO — with Aurora + ParticleMesh */}
      <header className="relative px-4 pt-14 pb-6 overflow-hidden">
        <AuroraBackground intensity="low" className="opacity-40" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0.15 }}
          aria-hidden
        >
          <ParticleMesh
            density={40}
            colorPrimary="#e60026"
            colorSecondary="#00bfff"
            connectionDistance={140}
            mobileBehavior="static-gradient"
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(0,68,255,0.10), transparent 65%)",
          }}
        />
        <span className="k-corner-tl" aria-hidden />
        <span className="k-corner-tr" aria-hidden />

        <div className="relative">
          <Eyebrow withBar={true} color="blue">
            Kronos · Box
          </Eyebrow>
          <div className="mt-2.5 flex items-baseline gap-2 flex-wrap">
            <span
              className="font-script text-[28px] leading-none"
              style={{ color: "var(--red)" }}
            >
              Hola,
            </span>
            <h1
              className="k-h-italic font-display font-extrabold text-[34px] leading-[1] tracking-[-0.02em]"
              style={{ color: "var(--text)" }}
            >
              <em>{home.athlete?.firstName}</em>
            </h1>
          </div>
        </div>
      </header>

      {/* PERSONALIZED GREETING */}
      <PersonalizedGreeting greeting={greeting} />

      {/* READINESS SURVEY */}
      {readinessSurvey && !alreadyRespondedReadiness && (
        <QuickSurvey survey={readinessSurvey} />
      )}

      {/* HERO STATS */}
      <AnimatedStats
        weekAttendance={home.weekAttendance}
        weekGoal={home.weekGoal}
        streak={home.streak}
        prCount={home.prCount}
      />

      {/* NEXT BOOKING */}
      <RevealOnScroll variant="fade-up" className="mt-4 px-3.5">
        {home.nextBooking ? (
          <KCard variant="featured">
            <div className="p-3.5 flex items-center gap-3.5">
              <div
                className="text-center px-2.5 py-1.5 rounded-xl min-w-[54px]"
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
                  style={{ color: "var(--moss)" }}
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
                      <span style={{ color: "var(--moss)" }}>
                        ● {nextClassDetail.bookedCount}/
                        {nextClassDetail.capacity}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <CancelMyBookingButton bookingId={home.nextBooking.bookingId} />
            </div>
          </KCard>
        ) : (
          <Link href="/atleta/reservar" className="block">
            <KCard variant="ghost">
              <p
                className="text-sm text-center py-3"
                style={{ color: "var(--text-2)" }}
              >
                Sin reservas activas. Toca para reservar.
              </p>
            </KCard>
          </Link>
        )}
      </RevealOnScroll>

      {/* WEEK STRIP */}
      <RevealOnScroll variant="fade-up" className="mt-5">
        <div className="flex items-baseline justify-between px-[18px] pb-2">
          <Eyebrow withBar={false} color="text">
            Esta semana
          </Eyebrow>
          <div
            className="font-mono text-[10px] font-bold tracking-[0.08em]"
            style={{ color: "var(--moss)" }}
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
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold transition-all duration-300"
                      style={{
                        background: isToday
                          ? "var(--grad)"
                          : booked
                            ? "var(--strain-soft)"
                            : "transparent",
                        border: isToday
                          ? "none"
                          : booked
                            ? "1px solid var(--strain-line)"
                            : "1px solid var(--line)",
                        color: isToday
                          ? "#0a0a0f"
                          : booked
                            ? "var(--strain)"
                            : rest
                              ? "var(--text-3)"
                              : "var(--text-2)",
                        boxShadow: isToday
                          ? "0 0 14px rgba(230, 0, 38, 0.20), 0 0 28px rgba(0, 68, 255, 0.10)"
                          : "none",
                      }}
                    >
                      {rest ? "·" : dayNum}
                    </div>
                    <div
                      className="font-mono text-[8px] font-bold h-2.5"
                      style={{
                        color: isToday
                          ? "var(--text)"
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
      </RevealOnScroll>

      {/* LEADERBOARD WOD HOY */}
      {topScores.length > 0 && wod && (
        <RevealOnScroll variant="fade-up" className="mt-5">
          <div className="flex items-baseline justify-between px-[18px] pb-2">
            <Eyebrow withBar={false} color="text">
              Leaderboard · {wod.wodName.toUpperCase()} hoy
            </Eyebrow>
            <Link
              href="/atleta/wod"
              className="font-mono text-[10px] font-bold tracking-[0.08em] hover:text-text-2 transition-colors"
              style={{ color: "var(--text-3)" }}
            >
              VER TODOS →
            </Link>
          </div>
          <div className="px-3.5">
            <div className="k-card overflow-hidden">
              <AnimatedSection>
                {topScores.map((s, i, a) => {
                  const isTop3 = i < 3;
                  const rankGlows = [
                    "0 0 14px rgba(0, 191, 255, 0.35)",
                    "0 0 10px rgba(0, 68, 255, 0.30)",
                    "0 0 8px rgba(255, 31, 71, 0.25)",
                  ];
                  return (
                    <AnimatedItem key={s.id}>
                      <div
                        className="flex items-center gap-3 px-4 py-3"
                        style={{
                          borderBottom:
                            i < a.length - 1 ? "1px solid var(--line)" : "none",
                        }}
                      >
                        <div
                          className="font-display text-lg font-bold w-5 text-center"
                          style={{
                            color: isTop3 ? "var(--moss)" : "var(--text-3)",
                            textShadow: isTop3 ? rankGlows[i] : "none",
                          }}
                        >
                          {i + 1}
                        </div>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{
                            background: isTop3
                              ? `var(--${["recovery", "strain", "pr"][i]}-soft)`
                              : "var(--bg-soft)",
                            border: `1px solid ${isTop3 ? `var(--${["recovery", "strain", "pr"][i]}-line)` : "var(--line)"}`,
                            color: isTop3
                              ? `var(--${["recovery", "strain", "pr"][i]})`
                              : "var(--text-3)",
                          }}
                        >
                          {s.athlete.firstName[0]}
                        </div>
                        <div className="flex-1 text-[13px] font-medium">
                          {s.athlete.firstName} {s.athlete.lastName?.[0]}.
                        </div>
                        <span
                          className={`k-chip ${s.scaling === "RX" ? "k-chip-moss" : "k-chip-ghost"}`}
                          style={{ padding: "3px 8px", fontSize: 9 }}
                        >
                          {s.scaling}
                        </span>
                        <div
                          className="font-display text-sm font-bold min-w-[54px] text-right"
                          style={{ color: "var(--text)" }}
                        >
                          {formatScore(
                            Number(s.value),
                            s.wod.scoreType as ScoreType,
                          )}
                        </div>
                      </div>
                    </AnimatedItem>
                  );
                })}
              </AnimatedSection>
            </div>
          </div>
        </RevealOnScroll>
      )}

      {/* LAST SCORE */}
      {home.lastScore && (
        <RevealOnScroll variant="fade-up" className="mt-4 px-3.5">
          <KCard>
            <div className="p-3.5 flex items-center gap-3.5">
              <div
                className="w-[42px] h-[42px] rounded-xl flex items-center justify-center"
                style={{
                  background: "var(--pr-soft)",
                  border: "1px solid var(--pr-line)",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--ember)"
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
          </KCard>
        </RevealOnScroll>
      )}

      {/* PR SHORTCUT */}
      {latestPR && (
        <RevealOnScroll variant="fade-up" className="mt-4 px-3.5">
          <KCard>
            <div className="p-3.5 flex items-center gap-3.5">
              <div
                className="w-[42px] h-[42px] rounded-xl flex items-center justify-center"
                style={{
                  background: "var(--pr-soft)",
                  border: "1px solid var(--pr-line)",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--ember)"
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
                    className="k-chip k-chip-ember"
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
          </KCard>
        </RevealOnScroll>
      )}

      {/* QUICK LINKS */}
      <RevealOnScroll variant="fade-up" className="mt-6 px-4">
        <div className="grid grid-cols-3 gap-2">
          <QuickLink href="/atleta/wod" label="WOD" tone="steel" icon="wod" />
          <QuickLink
            href="/atleta/reservar"
            label="Reservar"
            tone="moss"
            icon="calendar"
          />
          <QuickLink
            href="/atleta/movimientos"
            label="Movimientos"
            tone="fire"
            icon="dumbbell"
          />
          <QuickLink
            href="/atleta/leaderboard"
            label="Ranking"
            tone="ember"
            icon="trophy"
          />
          <QuickLink
            href="/atleta/historial"
            label="Historial"
            tone="ghost"
            icon="history"
          />
          <QuickLink
            href="/atleta/perfil"
            label="Perfil"
            tone="ghost"
            icon="user"
          />
        </div>
      </RevealOnScroll>
    </div>
  );
}

function QuickLink({
  href,
  label,
  tone,
  icon,
}: {
  href: string;
  label: string;
  tone: "moss" | "steel" | "ghost" | "fire" | "ember";
  icon: string;
}) {
  const color =
    tone === "moss"
      ? "var(--moss)"
      : tone === "steel"
        ? "var(--steel)"
        : tone === "fire"
          ? "var(--fire)"
          : tone === "ember"
            ? "var(--ember)"
            : "var(--text-2)";

  const iconSvgs: Record<string, React.ReactNode> = {
    wod: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12" />
      </svg>
    ),
    calendar: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    ),
    card: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <path d="M1 10h22" />
      </svg>
    ),
    user: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7" />
      </svg>
    ),
    dumbbell: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6.5 6.5l11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4" />
        <path d="M6.5 17.5L2 22M22 2l-4.5 4.5M10 5l4 4M5 10l4 4" />
      </svg>
    ),
    trophy: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
      </svg>
    ),
    history: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v5h5" />
        <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
        <path d="M12 7v5l4 2" />
      </svg>
    ),
  };

  return (
    <Link href={href as Route}>
      <KCard
        variant="ghost"
        className="p-4 flex items-center justify-center gap-2 text-center text-sm font-display font-semibold"
      >
        <span style={{ color }}>{iconSvgs[icon]}</span>
        <span style={{ color }}>{label}</span>
      </KCard>
    </Link>
  );
}
