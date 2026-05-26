/**
 * Skeleton fallback pieces for athlete home Suspense boundaries.
 *
 * Mined from loading.tsx — each export corresponds to a Suspense section in
 * the streaming page. loading.tsx imports them too to keep a single source of
 * truth for shapes.
 */

import { KronosSkeleton } from "@/components/kronos/KronosSkeleton";

// ─── Hero + Stats ─────────────────────────────────────────────────────────────

export function HeroSkeleton() {
  return (
    <div className="pb-4">
      {/* Header text */}
      <div className="pt-14 pb-6 px-4 space-y-3">
        <KronosSkeleton variant="line" width={120} height={9} />
        <KronosSkeleton variant="line" width={240} height={32} />
      </div>
      {/* Stats circles */}
      <div className="grid grid-cols-3 gap-3 px-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="k-card p-3 flex flex-col items-center gap-2"
            style={{ minHeight: 130 }}
          >
            <KronosSkeleton
              variant="circle"
              width={70}
              height={70}
              delay={i * 100}
            />
            <KronosSkeleton
              variant="line"
              width="60%"
              height={9}
              delay={i * 100 + 60}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Greeting ────────────────────────────────────────────────────────────────

export function GreetingSkeleton() {
  return (
    <div className="px-4 mt-2">
      <KronosSkeleton variant="line" width="55%" height={11} />
    </div>
  );
}

// ─── Survey ──────────────────────────────────────────────────────────────────

/** Surveys are optional — empty fallback so the skeleton doesn't reserve space */
export function SurveySkeleton() {
  return null;
}

// ─── Booking / Next class ────────────────────────────────────────────────────

export function BookingSkeleton() {
  return (
    <div className="k-card p-4 mt-4 mx-3.5 space-y-3">
      <KronosSkeleton variant="line" width={140} height={9} />
      <KronosSkeleton variant="line" width="80%" height={20} />
      <div className="flex gap-2">
        <KronosSkeleton variant="line" width={60} height={10} delay={60} />
        <KronosSkeleton variant="line" width={80} height={10} delay={120} />
      </div>
    </div>
  );
}

// ─── Week strip ───────────────────────────────────────────────────────────────

export function WeekStripSkeleton() {
  return (
    <div className="mt-5 px-3.5">
      <div className="flex justify-between px-1 pb-2">
        <KronosSkeleton variant="line" width={80} height={9} />
        <KronosSkeleton variant="line" width={100} height={9} />
      </div>
      <div
        style={{
          padding: 16,
          background: "var(--k-surface)",
          border: "1px solid var(--k-line)",
          borderRadius: 16,
        }}
      >
        <div className="flex justify-between gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <KronosSkeleton
                variant="line"
                width={14}
                height={9}
                delay={i * 30}
              />
              <KronosSkeleton
                variant="circle"
                width={36}
                height={36}
                rounded={12}
                delay={i * 30 + 20}
              />
              <KronosSkeleton
                variant="line"
                width={14}
                height={8}
                delay={i * 30 + 40}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export function LeaderboardSkeleton() {
  return (
    <div className="mt-5">
      <div className="flex justify-between px-[18px] pb-2">
        <KronosSkeleton variant="line" width={150} height={11} />
        <KronosSkeleton variant="line" width={60} height={11} />
      </div>
      <div className="px-3.5">
        <div
          style={{
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3"
              style={{
                borderBottom: i < 3 ? "1px solid var(--k-line)" : "none",
              }}
            >
              <KronosSkeleton
                variant="line"
                width={14}
                height={18}
                delay={i * 60}
              />
              <KronosSkeleton
                variant="circle"
                width={28}
                height={28}
                delay={i * 60 + 30}
              />
              <KronosSkeleton
                variant="line"
                width="40%"
                height={11}
                delay={i * 60 + 60}
              />
              <div className="ml-auto">
                <KronosSkeleton
                  variant="line"
                  width={50}
                  height={14}
                  delay={i * 60 + 90}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Recent activity (last score + latest PR) ─────────────────────────────────

export function RecentActivitySkeleton() {
  return (
    <div className="mt-4 px-3.5 space-y-3">
      <div className="k-card p-3.5 flex items-center gap-3.5">
        <KronosSkeleton variant="circle" width={42} height={42} rounded={12} />
        <div className="flex-1 space-y-1.5">
          <KronosSkeleton variant="line" width="55%" height={11} />
          <KronosSkeleton variant="line" width="40%" height={9} delay={40} />
        </div>
      </div>
    </div>
  );
}
