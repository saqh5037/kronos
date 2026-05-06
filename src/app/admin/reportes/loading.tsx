import { KronosSkeleton } from "@/components/kronos/KronosSkeleton";

export default function ReportesLoading() {
  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <KronosSkeleton variant="line" width={140} height={9} />
        <KronosSkeleton variant="line" width={220} height={32} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="k-card p-4 space-y-3"
            style={{ minHeight: 120 }}
          >
            <KronosSkeleton
              variant="line"
              width="55%"
              height={9}
              delay={i * 80}
            />
            <KronosSkeleton
              variant="line"
              width="75%"
              height={26}
              delay={i * 80 + 60}
            />
          </div>
        ))}
      </div>

      {/* Big chart */}
      <div className="k-card p-4 space-y-3">
        <KronosSkeleton variant="line" width={200} height={12} />
        <KronosSkeleton variant="chart" height={280} />
      </div>

      {/* Two side charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="k-card p-4 space-y-3">
          <KronosSkeleton variant="line" width={150} height={11} />
          <KronosSkeleton variant="chart" height={200} />
        </div>
        <div className="k-card p-4 space-y-3">
          <KronosSkeleton variant="line" width={150} height={11} />
          <KronosSkeleton variant="chart" height={200} />
        </div>
      </div>
    </div>
  );
}
