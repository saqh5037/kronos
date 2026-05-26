import { KronosSkeleton } from "@/components/kronos/KronosSkeleton";

export function DayContentSkeleton() {
  return (
    <>
      {/* Eyebrow */}
      <div style={{ padding: "0 20px", marginTop: 16 }}>
        <KronosSkeleton variant="line" width={160} height={9} />
      </div>
      {/* Class cards */}
      <div
        style={{
          marginTop: 14,
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: "var(--k-surface)",
              border: "1px solid var(--k-line)",
              borderRadius: 16,
              padding: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                flex: 1,
              }}
            >
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
            <KronosSkeleton
              variant="line"
              width={72}
              height={32}
              rounded={10}
              delay={i * 60 + 80}
            />
          </div>
        ))}
      </div>
    </>
  );
}
