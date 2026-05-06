import { KronosSkeleton } from "@/components/kronos/KronosSkeleton";

export default function AdminLoading() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <KronosSkeleton variant="line" width={140} height={10} />
          <KronosSkeleton variant="line" width={280} height={28} />
        </div>
        <KronosSkeleton variant="block" width={300} height={40} rounded={10} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="k-card p-4 space-y-3"
            style={{ minHeight: 130 }}
          >
            <KronosSkeleton
              variant="line"
              width={100}
              height={9}
              delay={i * 80}
            />
            <KronosSkeleton
              variant="line"
              width={120}
              height={28}
              delay={i * 80 + 40}
            />
            <KronosSkeleton
              variant="line"
              width="60%"
              height={9}
              delay={i * 80 + 80}
            />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="k-card p-4 space-y-4">
          <KronosSkeleton variant="line" width={180} height={12} />
          <KronosSkeleton variant="chart" height={220} />
        </div>
        <div className="k-card p-4 space-y-4">
          <KronosSkeleton variant="line" width={160} height={12} />
          <KronosSkeleton variant="chart" height={220} />
        </div>
      </div>

      {/* Lower row: upcoming + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 k-card p-4 space-y-3">
          <KronosSkeleton variant="line" width={180} height={12} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <KronosSkeleton
                variant="circle"
                width={36}
                height={36}
                delay={i * 60}
              />
              <div className="flex-1 space-y-1.5">
                <KronosSkeleton
                  variant="line"
                  width="40%"
                  height={11}
                  delay={i * 60}
                />
                <KronosSkeleton
                  variant="line"
                  width="65%"
                  height={9}
                  delay={i * 60 + 40}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="k-card p-4 space-y-3">
          <KronosSkeleton variant="line" width={130} height={12} />
          {Array.from({ length: 3 }).map((_, i) => (
            <KronosSkeleton
              key={i}
              variant="block"
              height={56}
              delay={i * 80}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
