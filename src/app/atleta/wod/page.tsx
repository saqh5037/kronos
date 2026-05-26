import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getBoxMode } from "@/server/actions/box-mode";
import { WodContentSection } from "./_components/sections/WodContentSection";
import { WodContentSkeleton } from "./skeletons";

export const metadata = { title: "Kronos — WOD del día" };

/**
 * WOD page — streaming version.
 *
 * getBoxMode() must stay in the shell (redirect must happen at page level).
 * The heavy fetches (getTodayWOD + listMyScores) are deferred to WodContentSection.
 */
export default async function WODPage() {
  const { isPersonal } = await getBoxMode();
  if (isPersonal) redirect("/atleta/wod/nuevo");

  return (
    <Suspense fallback={<WodContentSkeleton />}>
      <WodContentSection />
    </Suspense>
  );
}
