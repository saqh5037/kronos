import {
  KronosSkeleton,
  KronosSkeletonLines,
} from "@/components/kronos/KronosSkeleton";

export default function SkeletonsDemo() {
  if (process.env.NODE_ENV !== "development") return null;
  return (
    <div className="min-h-screen p-8" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <h1 className="font-display text-2xl font-bold">
            KronosSkeleton — demo cinematic shimmer
          </h1>
          <p
            className="text-xs font-mono mt-1"
            style={{ color: "var(--text-3)" }}
          >
            dev only · /dev/skeletons-demo
          </p>
        </header>

        <section className="k-card p-6 space-y-4">
          <h2 className="k-eyebrow">Variants</h2>
          <div className="space-y-3">
            <div>
              <p
                className="text-[10px] font-mono mb-1"
                style={{ color: "var(--text-3)" }}
              >
                line
              </p>
              <KronosSkeleton variant="line" />
            </div>
            <div>
              <p
                className="text-[10px] font-mono mb-1"
                style={{ color: "var(--text-3)" }}
              >
                line · width 60%, height 24
              </p>
              <KronosSkeleton variant="line" width="60%" height={24} />
            </div>
            <div>
              <p
                className="text-[10px] font-mono mb-1"
                style={{ color: "var(--text-3)" }}
              >
                circle 48
              </p>
              <KronosSkeleton variant="circle" width={48} height={48} />
            </div>
            <div>
              <p
                className="text-[10px] font-mono mb-1"
                style={{ color: "var(--text-3)" }}
              >
                block
              </p>
              <KronosSkeleton variant="block" />
            </div>
            <div>
              <p
                className="text-[10px] font-mono mb-1"
                style={{ color: "var(--text-3)" }}
              >
                chart
              </p>
              <KronosSkeleton variant="chart" />
            </div>
            <div>
              <p
                className="text-[10px] font-mono mb-1"
                style={{ color: "var(--text-3)" }}
              >
                lines (stagger)
              </p>
              <KronosSkeletonLines count={4} />
            </div>
          </div>
        </section>

        <section className="k-card p-6 space-y-4">
          <h2 className="k-eyebrow">Loading state — Dashboard mock</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="k-card p-3 space-y-2"
                style={{ minHeight: 110 }}
              >
                <KronosSkeleton
                  variant="line"
                  width="60%"
                  height={9}
                  delay={i * 80}
                />
                <KronosSkeleton
                  variant="line"
                  width="80%"
                  height={26}
                  delay={i * 80 + 40}
                />
              </div>
            ))}
          </div>
          <KronosSkeleton variant="chart" height={220} />
        </section>
      </div>
    </div>
  );
}
