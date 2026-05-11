"use client";

import { KronosSkeleton } from "@/components/kronos/KronosSkeleton";

interface Props {
  titleWidth?: number;
  subtitleWidth?: number;
  cardCount?: number;
  showList?: boolean;
  listCount?: number;
}

export default function AtletaPageSkeleton({
  titleWidth = 180,
  subtitleWidth = 140,
  cardCount = 3,
  showList = true,
  listCount = 5,
}: Props) {
  return (
    <div className="pb-28 px-4">
      {/* Header */}
      <div className="pt-14 pb-6 space-y-2">
        <KronosSkeleton variant="line" width={subtitleWidth} height={9} />
        <KronosSkeleton variant="line" width={titleWidth} height={28} />
      </div>

      {/* Cards */}
      {cardCount > 0 && (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns:
              cardCount >= 3 ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
          }}
        >
          {Array.from({ length: cardCount }).map((_, i) => (
            <div
              key={i}
              className="k-card p-3 space-y-2"
              style={{ minHeight: 100 }}
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
      )}

      {/* List */}
      {showList && (
        <div className="mt-5 space-y-2">
          <KronosSkeleton variant="line" width={150} height={11} />
          <div className="k-card overflow-hidden">
            {Array.from({ length: listCount }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
                style={{ borderColor: "var(--line)" }}
              >
                <KronosSkeleton
                  variant="circle"
                  width={28}
                  height={28}
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
                  width={50}
                  height={14}
                  delay={i * 50 + 90}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
