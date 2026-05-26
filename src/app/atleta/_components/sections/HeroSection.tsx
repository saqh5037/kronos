/**
 * HeroSection — streams: header, StreakHero, AnimatedStats, TrophyStrip.
 *
 * Also owns the empty-state (no athlete profile) because it's the first section
 * that depends on getAthleteHome(). If home is null, it renders the "Sin perfil"
 * card and the remaining sections simply won't mount (they await the same cached
 * fetch and also get null back, rendering nothing).
 */

import { getAthleteHomeCached } from "../request-cache";
import { getAthleteTrophies } from "@/server/actions/athlete-home";
import { StreakHero } from "@/components/atleta/StreakHero";
import { TrophyStrip } from "@/components/atleta/TrophyStrip";
import { AnimatedStats } from "@/components/kronos/AnimatedStats";
import { TourTriggerButton } from "@/components/tour/TourTriggerButton";
import { homeTour } from "@/components/tour/tours/home";

export async function HeroSection() {
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

  // Trophies are fetched in parallel here since they're co-located in this section.
  // No dedup needed — only this section uses them.
  const trophies = await getAthleteTrophies();

  return (
    <>
      {/* HERO HEADER */}
      <header
        data-tour="home.hero"
        style={{
          padding: "56px 20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
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
            fontSize: 36,
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

      {/* STREAK HERO + STATS */}
      <div data-tour="home.stats">
        <div className="px-3.5 mt-4">
          <StreakHero
            count={home.streak}
            lastEventAt={home.streakLastEventAt}
          />
        </div>
        <AnimatedStats
          weekAttendance={home.weekAttendance}
          weekGoal={home.weekGoal}
          streak={home.streak}
          prCount={home.prCount}
        />
      </div>

      {/* TROPHY STRIP */}
      {trophies.length > 0 && (
        <div className="mt-4 px-3.5">
          <div className="k-eyebrow mb-2" style={{ color: "var(--k-t2)" }}>
            LOGROS · {home.xpTotal} XP
          </div>
          <TrophyStrip items={trophies} />
        </div>
      )}
    </>
  );
}
