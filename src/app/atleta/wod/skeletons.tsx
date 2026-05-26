import { KronosSkeleton } from "@/components/kronos/KronosSkeleton";

export function WodContentSkeleton() {
  return (
    <div className="pb-28 px-4">
      {/* Eyebrow + title */}
      <div className="pt-10 pb-4 space-y-3">
        <KronosSkeleton variant="line" width={80} height={9} />
        <KronosSkeleton variant="line" width={220} height={36} />
        <KronosSkeleton variant="line" width={140} height={11} />
      </div>

      {/* Rounds badge */}
      <div className="flex gap-2 mb-4">
        <KronosSkeleton variant="line" width={90} height={32} rounded={10} />
        <KronosSkeleton
          variant="line"
          width={120}
          height={32}
          rounded={10}
          delay={40}
        />
      </div>

      {/* Movement rows */}
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
            style={{ borderBottom: i < 3 ? "1px solid var(--k-line)" : "none" }}
          >
            <KronosSkeleton
              variant="circle"
              width={32}
              height={32}
              delay={i * 50}
            />
            <div className="flex-1 space-y-1.5">
              <KronosSkeleton
                variant="line"
                width="55%"
                height={11}
                delay={i * 50 + 30}
              />
              <KronosSkeleton
                variant="line"
                width="35%"
                height={9}
                delay={i * 50 + 60}
              />
            </div>
            <KronosSkeleton
              variant="line"
              width={36}
              height={18}
              delay={i * 50 + 80}
            />
          </div>
        ))}
      </div>

      {/* Score form placeholder */}
      <div className="mt-5">
        <KronosSkeleton variant="block" height={56} rounded={14} />
      </div>
    </div>
  );
}
