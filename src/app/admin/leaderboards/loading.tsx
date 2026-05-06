import { KronosSkeleton } from "@/components/kronos/KronosSkeleton";

export default function AdminLeaderboardsLoading() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <KronosSkeleton variant="line" width={140} height={9} />
        <KronosSkeleton variant="line" width={240} height={32} />
        <KronosSkeleton variant="line" width="50%" height={11} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* WOD leaderboard */}
        <div className="lg:col-span-2 space-y-4">
          <KronosSkeleton variant="block" height={48} rounded={12} />
          <div className="k-card overflow-hidden">
            <div
              className="px-4 py-3 border-b space-y-2"
              style={{ borderColor: "var(--line)" }}
            >
              <KronosSkeleton variant="line" width="40%" height={14} />
              <KronosSkeleton variant="line" width="25%" height={9} />
            </div>
            <div className="p-4 space-y-3">
              {/* Podium */}
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <KronosSkeleton
                    key={i}
                    variant="block"
                    height={110}
                    delay={i * 80}
                  />
                ))}
              </div>
              {/* Table rows */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2">
                  <KronosSkeleton
                    variant="line"
                    width={20}
                    height={11}
                    delay={i * 50}
                  />
                  <KronosSkeleton
                    variant="line"
                    width="35%"
                    height={11}
                    delay={i * 50 + 40}
                  />
                  <KronosSkeleton
                    variant="line"
                    width={70}
                    height={14}
                    delay={i * 50 + 80}
                  />
                  <div className="ml-auto">
                    <KronosSkeleton
                      variant="line"
                      width={50}
                      height={11}
                      delay={i * 50 + 120}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly attendance */}
        <div className="space-y-3">
          <KronosSkeleton variant="line" width={160} height={11} />
          <div className="k-card overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
                style={{ borderColor: "var(--line)" }}
              >
                <KronosSkeleton
                  variant="line"
                  width={16}
                  height={11}
                  delay={i * 60}
                />
                <KronosSkeleton
                  variant="line"
                  width="55%"
                  height={11}
                  delay={i * 60 + 40}
                />
                <div className="ml-auto">
                  <KronosSkeleton
                    variant="line"
                    width={28}
                    height={14}
                    delay={i * 60 + 80}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
