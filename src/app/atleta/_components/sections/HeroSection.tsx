/**
 * Home header + streak/stats, split into two sections.
 *
 * Audit 2026-09-15, P0 #8: the first viewport was hamburger/bell → "Hola,
 * Emma" → streak hero → three rings → the start of the badge strip, with zero
 * actions, and today's WOD 1,100 px down. The page now goes
 *   header → "Hoy" card (WOD + your class + one lime CTA) → streak + rings,
 * so `HomeHeaderSection` and `HeroSection` are separate Suspense islands with
 * `TodaySection` between them.
 *
 * `HomeHeaderSection` also owns the empty-state (no athlete profile) because it
 * is the first section that depends on getAthleteHome(). If home is null, it
 * renders the "Sin perfil" card and the remaining sections simply won't mount
 * (they await the same cached fetch and also get null back, rendering nothing).
 */

import { getAthleteHomeCached } from "../request-cache";
import { StreakHero } from "@/components/atleta/StreakHero";
import { HomeStatsRow } from "../HomeStatsRow";
import { TourTriggerButton } from "@/components/tour/TourTriggerButton";
import { homeTour } from "@/components/tour/tours/home";

export async function HomeHeaderSection() {
  const home = await getAthleteHomeCached();

  if (!home) {
    return (
      <div style={{ padding: "64px 16px 24px" }}>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
          }}
        >
          INICIO · ATLETA
        </span>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--k-t1)",
            margin: "8px 0 0",
          }}
        >
          Sin perfil
        </h1>
        <div
          style={{
            marginTop: 24,
            padding: 24,
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            borderRadius: 16,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "var(--k-t2)",
              fontFamily: "var(--k-font-body)",
              margin: 0,
            }}
          >
            No tienes perfil de atleta vinculado. Contacta al coach del box.
          </p>
        </div>
      </div>
    );
  }

  return (
    <header
      data-tour="home.hero"
      style={{
        // 56px clears the 40px hamburger pinned at top:12 (see atleta/layout).
        padding: "56px 20px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 56, right: 20 }}>
        <TourTriggerButton tourId={homeTour.id} />
      </div>
      <span
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.2em",
          color: "var(--k-t3)",
          textTransform: "uppercase",
        }}
      >
        INICIO · ATLETA
      </span>
      <h1
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "var(--k-t1)",
          margin: 0,
          lineHeight: 1.05,
        }}
      >
        Hola, {home.athlete?.firstName}
      </h1>
    </header>
  );
}

export async function HeroSection() {
  const home = await getAthleteHomeCached();
  if (!home) return null;

  return (
    <div data-tour="home.stats">
      <div className="px-3.5 mt-5">
        <StreakHero count={home.streak} lastEventAt={home.streakLastEventAt} />
      </div>
      <HomeStatsRow
        weekAttendance={home.weekAttendance}
        weekGoal={home.weekGoal}
        streak={home.streak}
        prCount={home.prCount}
      />
    </div>
  );
}
