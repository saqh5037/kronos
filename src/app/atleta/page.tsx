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

      {/* QUICK LINKS — solo los que NO están en TabBar (Movimientos / Ranking / Historial) */}
      <RevealOnScroll variant="fade-up" className="mt-6 px-4">
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.18em",
            color: "var(--k-t3)",
            marginBottom: 12,
          }}
        >
          EXPLORAR
        </div>
        <div className="grid grid-cols-3 gap-2">
          <QuickLink
            href="/atleta/movimientos"
            label="Movimientos"
            icon="dumbbell"
          />
          <QuickLink href="/atleta/leaderboard" label="Ranking" icon="trophy" />
          <QuickLink
            href="/atleta/historial"
            label="Historial"
            icon="history"
          />
        </div>
      </RevealOnScroll>
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: "dumbbell" | "trophy" | "history";
}) {
  const iconNode = (() => {
    const common = {
      width: 22,
      height: 22,
      viewBox: "0 0 24 24",
      fill: "none" as const,
      stroke: "currentColor",
      strokeWidth: 1.5,
      strokeLinecap: "square" as const,
      strokeLinejoin: "miter" as const,
    };
    if (icon === "dumbbell")
      return (
        <svg {...common}>
          <path d="M2 12h2M20 12h2M5 8h3v8H5zM16 8h3v8h-3zM8 12h8" />
        </svg>
      );
    if (icon === "trophy")
      return (
        <svg {...common}>
          <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
          <path d="M3 6h4M17 6h4M9 20h6M12 15v5" />
        </svg>
      );
    return (
      <svg {...common}>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </svg>
    );
  })();

  return (
    <Link
      href={href as Route}
      className="k-tap"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-line)",
        borderRadius: 14,
        padding: "16px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        textDecoration: "none",
        color: "var(--k-t1)",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: "var(--k-elevated)",
          border: "1px solid var(--k-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--k-accent)",
        }}
      >
        {iconNode}
      </div>
      <span
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.16em",
          color: "var(--k-t2)",
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        {label}
      </span>
    </Link>
  );
}
