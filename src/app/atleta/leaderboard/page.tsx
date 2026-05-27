import { Suspense } from "react";
import { getBoxMode } from "@/server/actions/box-mode";
import { EmptyStateCTA } from "@/components/kronos/EmptyStateCTA";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import { LeaderboardContentSection } from "./_components/sections/LeaderboardContentSection";
import LeaderboardLoading from "./loading";

export const metadata = { title: "Kronos — Leaderboards" };

/**
 * Leaderboard page — streaming version.
 *
 * getBoxMode() must stay in the shell. Boxless (personal box) athletes have no
 * peers to rank against, so instead of a silent redirect to /atleta (a dead-end
 * the athlete can't understand) we explain WHY rankings need a box.
 * All five data fetches are deferred to LeaderboardContentSection.
 */
export default async function LeaderboardPage() {
  const { isPersonal } = await getBoxMode();

  if (isPersonal) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--k-bg)",
          color: "var(--k-t1)",
          fontFamily: "var(--k-font-body)",
          paddingBottom: 96,
        }}
      >
        <div style={{ padding: "48px 16px 0" }}>
          <AthleteBackLink href="/atleta" label="Inicio" />
        </div>
        <div style={{ padding: "24px 20px" }}>
          <EmptyStateCTA
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
            }
            title="Los rankings son por box"
            description="El leaderboard compara scores entre atletas del mismo box. Cuando te unas a un box en Kronos, verás tu ranking aquí."
            ctaLabel="Ver mi WOD"
            ctaHref="/atleta/wod"
          />
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<LeaderboardLoading />}>
      <LeaderboardContentSection />
    </Suspense>
  );
}
