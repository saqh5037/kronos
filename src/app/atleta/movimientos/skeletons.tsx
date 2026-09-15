import { KronosSkeleton } from "@/components/kronos/KronosSkeleton";

/**
 * Matches the library-first layout: header, search, filter chips, card grid.
 * The old skeleton drew a list of ranked rows, which is no longer what loads.
 */
export function MovimientosContentSkeleton() {
  return (
    <div className="pb-28">
      <div
        style={{
          padding: "56px 20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <KronosSkeleton variant="line" width={130} height={9} />
        <KronosSkeleton variant="line" width={240} height={28} delay={40} />
        <KronosSkeleton variant="line" width={180} height={11} delay={80} />
      </div>

      <div className="px-3.5 space-y-4">
        <KronosSkeleton variant="line" width="100%" height={44} delay={60} />
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <KronosSkeleton
              key={i}
              variant="line"
              width={78}
              height={34}
              delay={80 + i * 20}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="k-card k-skeleton"
              style={{ height: 176, borderRadius: 12 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
