import { Suspense } from "react";
import Link from "next/link";
import { Icon } from "@/components/kronos/v3/icons";
import { TourTriggerButton } from "@/components/tour/TourTriggerButton";
import { reservarTour } from "@/components/tour/tours/reservar";
import { DayContentSection } from "./_components/sections/DayContentSection";
import { DayContentSkeleton } from "./skeletons";

export const metadata = { title: "Kronos — Reservar" };

type SearchParams = { date?: string };

const DAY_ABBR = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

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

function formatDateParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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

  // 7 days starting today — pure computation, no fetch
  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

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

      {/* Week strip — paints immediately (pure Date math, no fetch) */}
      <div
        data-tour="reservar.week-strip"
        style={{
          padding: "0 20px",
          display: "flex",
          gap: 8,
          overflowX: "auto",
          marginTop: 12,
        }}
      >
        {days.map((d) => {
          const isSel = sameDay(d, selected);
          const isToday = sameDay(d, today);
          return (
            <Link
              key={d.toISOString()}
              href={
                {
                  pathname: "/atleta/reservar",
                  query: { date: formatDateParam(d) },
                } as unknown as React.ComponentProps<typeof Link>["href"]
              }
              className="k-tap"
              style={{
                flexShrink: 0,
                width: 54,
                height: 74,
                borderRadius: 14,
                background: isSel ? "var(--k-elevated)" : "var(--k-surface)",
                border:
                  !isSel && isToday
                    ? "1px dashed var(--k-t2)"
                    : `1px solid ${isSel ? "var(--k-line-2)" : "var(--k-line)"}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                position: "relative",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  color: "var(--k-t3)",
                }}
              >
                {DAY_ABBR[d.getDay()]}
              </span>
              <span
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: isSel ? "var(--k-t2)" : "var(--k-t1)",
                  lineHeight: 1,
                }}
              >
                {d.getDate()}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Day content (eyebrow + class list) — streams in as fetch resolves */}
      <Suspense fallback={<DayContentSkeleton />}>
        <DayContentSection
          selectedIso={selected.toISOString()}
          todayIso={today.toISOString()}
        />
      </Suspense>
    </div>
  );
}
