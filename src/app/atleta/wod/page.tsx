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
 * The heavy fetches (getWodForDate + listMyScores) are deferred to WodContentSection.
 *
 * searchParams.date: optional "YYYY-MM-DD" for day navigation. Defaults to today in box tz.
 */
export default async function WODPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { isPersonal } = await getBoxMode();
  if (isPersonal) redirect("/atleta/wod/nuevo");

  const params = await searchParams;
  const dateParam = params.date;

  return (
    <Suspense fallback={<WodContentSkeleton />}>
      <WodContentSection dateParam={dateParam} />
    </Suspense>
  );
}
