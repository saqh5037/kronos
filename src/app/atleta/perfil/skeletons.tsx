import { KronosSkeleton } from "@/components/kronos/KronosSkeleton";

// ─── Hero + Racha + Stats ────────────────────────────────────────────────────

export function PerfilHeroSkeleton() {
  return (
    <div className="pb-3.5">
      {/* Header */}
      <div className="pt-12 pb-4 px-4 flex items-center gap-3.5">
        <KronosSkeleton variant="circle" width={72} height={72} />
        <div className="flex-1 space-y-2">
          <KronosSkeleton variant="line" width={160} height={22} />
          <KronosSkeleton variant="line" width={60} height={9} delay={40} />
        </div>
      </div>
      {/* Racha card */}
      <div className="px-3.5 mb-3.5">
        <div
          style={{
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <div className="flex items-center gap-4">
            <KronosSkeleton variant="line" width={64} height={72} />
            <div className="flex-1 space-y-2">
              <KronosSkeleton variant="line" width={80} height={9} delay={40} />
              <KronosSkeleton
                variant="line"
                width={140}
                height={14}
                delay={80}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Stats grid */}
      <div className="px-3.5 grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="k-card p-3.5 space-y-2"
            style={{ minHeight: 80 }}
          >
            <KronosSkeleton
              variant="line"
              width="50%"
              height={9}
              delay={i * 60}
            />
            <KronosSkeleton
              variant="line"
              width="70%"
              height={22}
              delay={i * 60 + 40}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PRs grid ─────────────────────────────────────────────────────────────────

export function PRsSkeleton() {
  return (
    <div className="mt-2 px-3.5 grid grid-cols-2 gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="k-card p-3 space-y-2" style={{ minHeight: 90 }}>
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
  );
}

// ─── Scores + activity chart ──────────────────────────────────────────────────

export function ScoresSkeleton() {
  return (
    <div className="mt-5 px-3.5 space-y-2">
      <KronosSkeleton variant="line" width={130} height={11} />
      <div
        style={{
          background: "var(--k-surface)",
          border: "1px solid var(--k-line)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: i < 4 ? "1px solid var(--k-line)" : "none" }}
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
  );
}

// ─── Chart skeleton (reused for timeline + capability + heatmap) ───────────────

export function ChartSkeleton() {
  return (
    <div className="mt-5 px-3.5">
      <div className="k-card p-4 space-y-3">
        <KronosSkeleton variant="line" width={170} height={11} />
        <KronosSkeleton variant="chart" height={200} />
      </div>
    </div>
  );
}
