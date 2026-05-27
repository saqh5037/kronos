import { Suspense } from "react";
import Link from "next/link";
import { Icon } from "@/components/kronos/v3/icons";
import { EmptyStateCTA } from "@/components/kronos/EmptyStateCTA";
import { getBoxMode } from "@/server/actions/box-mode";
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

  // Boxless (personal box, slug `me-*`) athletes have no class schedule — the
  // week strip would be permanently empty. Show an honest branded state that
  // points them to the surfaces that DO work without a box.
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
        {/* Header */}
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
          <div style={{ width: 36 }} />
        </div>

        <div style={{ padding: "32px 20px" }}>
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
                <rect x="3" y="5" width="18" height="16" />
                <path d="M3 9h18M8 3v4M16 3v4" />
                <path d="M7 13h2m4 0h2M7 17h2" />
              </svg>
            }
            title="Las reservas son por box"
            description="Estás entrenando en modo independiente. Para reservar clases necesitas unirte a un box de Kronos — ellos gestionan el horario de clases por ti."
            ctaLabel="Registrar mi WOD"
            ctaHref="/atleta/wod"
            secondaryLabel="Revisar mis PRs"
            secondaryHref="/atleta/perfil"
          />
        </div>
      </div>
    );
  }

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
