import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getBoxMode } from "@/server/actions/box-mode";
import { LeaderboardContentSection } from "./_components/sections/LeaderboardContentSection";
import LeaderboardLoading from "./loading";

export const metadata = { title: "Kronos — Leaderboards" };

/**
 * Leaderboard page — streaming version.
 *
 * getBoxMode() must stay in the shell for the redirect guard.
 * All five data fetches are deferred to LeaderboardContentSection.
 */
export default async function LeaderboardPage() {
  const { isPersonal } = await getBoxMode();
  if (isPersonal) redirect("/atleta");

  return (
    <Suspense fallback={<LeaderboardLoading />}>
      <LeaderboardContentSection />
    </Suspense>
  );
}
