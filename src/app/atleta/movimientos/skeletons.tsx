import { KronosSkeleton } from "@/components/kronos/KronosSkeleton";

export function MovimientosContentSkeleton() {
  return (
    <div className="pb-28">
      {/* Header */}
      <div
        style={{
          padding: "56px 20px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <KronosSkeleton variant="line" width={130} height={9} />
        <KronosSkeleton variant="line" width={240} height={28} delay={40} />
        <KronosSkeleton variant="line" width={100} height={11} delay={80} />
      </div>

      {/* Movement rows */}
      <div className="px-3.5 mt-2 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: "var(--k-surface)",
              border: "1px solid var(--k-line)",
              borderRadius: 14,
              padding: "14px 12px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <KronosSkeleton
              variant="line"
              width={16}
              height={14}
              delay={i * 40}
            />
            <div className="flex-1 space-y-1.5">
              <KronosSkeleton
                variant="line"
                width="50%"
                height={11}
                delay={i * 40 + 20}
              />
              <KronosSkeleton
                variant="line"
                width="35%"
                height={8}
                delay={i * 40 + 50}
              />
            </div>
            <div className="text-right space-y-1">
              <KronosSkeleton
                variant="line"
                width={56}
                height={14}
                delay={i * 40 + 70}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
