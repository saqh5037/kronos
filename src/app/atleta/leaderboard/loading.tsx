import { KronosSkeleton } from "@/components/kronos/KronosSkeleton";

export default function LeaderboardLoading() {
  return (
    <div className="pb-28 px-4">
      {/* Header */}
      <div className="pt-14 pb-5 space-y-2">
        <KronosSkeleton variant="line" width={120} height={9} />
        <KronosSkeleton variant="line" width={220} height={28} />
      </div>

      {/* Tabs */}
      <KronosSkeleton variant="block" height={42} rounded={12} />

      {/* Filter selector */}
      <div className="mt-3">
        <KronosSkeleton variant="block" height={44} rounded={12} />
      </div>

      {/* Ranking rows */}
      <div className="mt-3 k-card overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
            style={{ borderColor: "var(--line)" }}
          >
            <KronosSkeleton
              variant="line"
              width={16}
              height={18}
              delay={i * 50}
            />
            <KronosSkeleton
              variant="circle"
              width={28}
              height={28}
              delay={i * 50 + 30}
            />
            <KronosSkeleton
              variant="line"
              width="45%"
              height={11}
              delay={i * 50 + 60}
            />
            <div className="ml-auto flex items-center gap-2">
              <KronosSkeleton
                variant="line"
                width={28}
                height={14}
                rounded={999}
                delay={i * 50 + 80}
              />
              <KronosSkeleton
                variant="line"
                width={56}
                height={16}
                delay={i * 50 + 100}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
