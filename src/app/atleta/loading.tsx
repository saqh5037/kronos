import { KronosSkeleton } from "@/components/kronos/KronosSkeleton";

export default function AtletaLoading() {
  return (
    <div className="pb-28 px-4">
      {/* Hero header */}
      <div className="pt-14 pb-6 space-y-3">
        <KronosSkeleton variant="line" width={120} height={9} />
        <KronosSkeleton variant="line" width={240} height={32} />
        <KronosSkeleton variant="line" width="55%" height={11} />
      </div>

      {/* HaloRings stats row */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="k-card p-3 flex flex-col items-center gap-2"
            style={{ minHeight: 130 }}
          >
            <KronosSkeleton
              variant="circle"
              width={70}
              height={70}
              delay={i * 100}
            />
            <KronosSkeleton
              variant="line"
              width="60%"
              height={9}
              delay={i * 100 + 60}
            />
          </div>
        ))}
      </div>

      {/* Próxima clase */}
      <div className="k-card p-4 mt-4 space-y-3">
        <KronosSkeleton variant="line" width={140} height={9} />
        <KronosSkeleton variant="line" width="80%" height={20} />
        <div className="flex gap-2">
          <KronosSkeleton variant="line" width={60} height={10} delay={60} />
          <KronosSkeleton variant="line" width={80} height={10} delay={120} />
        </div>
      </div>

      {/* Top scores list */}
      <div className="mt-5 space-y-2">
        <KronosSkeleton variant="line" width={150} height={11} />
        <div className="k-card overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
              style={{ borderColor: "var(--line)" }}
            >
              <KronosSkeleton
                variant="line"
                width={14}
                height={18}
                delay={i * 60}
              />
              <KronosSkeleton
                variant="circle"
                width={28}
                height={28}
                delay={i * 60 + 30}
              />
              <KronosSkeleton
                variant="line"
                width="40%"
                height={11}
                delay={i * 60 + 60}
              />
              <div className="ml-auto">
                <KronosSkeleton
                  variant="line"
                  width={50}
                  height={14}
                  delay={i * 60 + 90}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
