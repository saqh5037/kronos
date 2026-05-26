import { Suspense } from "react";
import Link from "next/link";
import { Icon } from "@/components/kronos/v3/icons";
import { TourTriggerButton } from "@/components/tour/TourTriggerButton";
import { reservarTour } from "@/components/tour/tours/reservar";
import { DayContentSection } from "./_components/sections/DayContentSection";
import { WeekStripSection } from "./_components/sections/WeekStripSection";
import { WeekStrip } from "./_components/WeekStrip";
import { DayContentSkeleton } from "./skeletons";

export const metadata = { title: "Kronos — Reservar" };

type SearchParams = { date?: string };

function parseDate(s: string | undefined): Date {
  if (s) {
    const [y, m, d] = s.split("-").map(Number);
    if (y && m && d) {
      const dt = new Date(y, m - 1, d);
      dt.setHours(0, 0, 0, 0);
      return dt;
    }
  }
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

export default async function ReservarPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = parseDate(sp.date);
  const selectedIso = selected.toISOString();
  const todayIso = today.toISOString();

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
      {/* Header — paints immediately */}
      <div
        style={{
          height: 48,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 8,
        }}
      >
        <Link
          href="/atleta"
          aria-label="Volver"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "transparent",
            border: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--k-t1)",
            textDecoration: "none",
          }}
        >
          <Icon.Back width={20} height={20} />
        </Link>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--k-t2)",
          }}
        >
          RESERVAR
        </span>
        <TourTriggerButton tourId={reservarTour.id} />
      </div>

      {/* Week strip — labels/numbers paint instantly via the fallback (pure date
          math); the reserved-day dots stream in once the class list resolves. */}
      <Suspense
        fallback={
          <WeekStrip
            selectedIso={selectedIso}
            todayIso={todayIso}
            bookedDayKeys={new Set()}
          />
        }
      >
        <WeekStripSection selectedIso={selectedIso} todayIso={todayIso} />
      </Suspense>

      {/* Day content (eyebrow + class list) — streams in as fetch resolves */}
      <Suspense fallback={<DayContentSkeleton />}>
        <DayContentSection selectedIso={selectedIso} todayIso={todayIso} />
      </Suspense>
    </div>
  );
}
