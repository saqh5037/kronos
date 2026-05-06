import { KronosSkeleton } from "@/components/kronos/KronosSkeleton";

export default function PerfilLoading() {
  return (
    <div className="pb-28 px-4">
      {/* Header */}
      <div className="pt-14 pb-6 space-y-3">
        <KronosSkeleton variant="line" width={100} height={9} />
        <KronosSkeleton variant="line" width={200} height={28} />
      </div>

      {/* PRs grid */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="k-card p-3 space-y-2"
            style={{ minHeight: 90 }}
          >
            <KronosSkeleton
              variant="line"
              width="60%"
              height={9}
              delay={i * 60}
            />
            <KronosSkeleton
              variant="line"
              width="80%"
              height={20}
              delay={i * 60 + 40}
            />
            <KronosSkeleton
              variant="line"
              width="40%"
              height={9}
              delay={i * 60 + 80}
            />
          </div>
        ))}
      </div>

      {/* Scores timeline chart */}
      <div className="k-card p-4 mt-5 space-y-3">
        <KronosSkeleton variant="line" width={170} height={11} />
        <KronosSkeleton variant="chart" height={200} />
      </div>

      {/* Historial scores */}
      <div className="mt-5 space-y-2">
        <KronosSkeleton variant="line" width={130} height={11} />
        <div className="k-card overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="flex-1 space-y-1.5">
                <KronosSkeleton
                  variant="line"
                  width="55%"
                  height={11}
                  delay={i * 50}
                />
                <KronosSkeleton
                  variant="line"
                  width="35%"
                  height={9}
                  delay={i * 50 + 40}
                />
              </div>
              <KronosSkeleton
                variant="line"
                width={64}
                height={18}
                delay={i * 50 + 80}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
