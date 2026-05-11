"use client";

import { KronosSkeleton } from "@/components/kronos/KronosSkeleton";

interface Props {
  titleWidth?: number;
  showKpiCards?: boolean;
  kpiCount?: number;
  showTable?: boolean;
  tableRows?: number;
  showForm?: boolean;
}

export default function AdminPageSkeleton({
  titleWidth = 280,
  showKpiCards = true,
  kpiCount = 4,
  showTable = true,
  tableRows = 6,
  showForm = false,
}: Props) {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <KronosSkeleton variant="line" width={140} height={10} />
          <KronosSkeleton variant="line" width={titleWidth} height={28} />
        </div>
        <KronosSkeleton variant="block" width={160} height={40} rounded={10} />
      </div>

      {/* KPI cards */}
      {showKpiCards && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: kpiCount }).map((_, i) => (
            <div
              key={i}
              className="k-card p-4 space-y-3"
              style={{ minHeight: 110 }}
            >
              <KronosSkeleton
                variant="line"
                width={100}
                height={9}
                delay={i * 60}
              />
              <KronosSkeleton
                variant="line"
                width={80}
                height={24}
                delay={i * 60 + 40}
              />
              <KronosSkeleton
                variant="line"
                width="60%"
                height={9}
                delay={i * 60 + 80}
              />
            </div>
          ))}
        </div>
      )}

      {/* Form placeholder */}
      {showForm && (
        <div className="k-card p-5 space-y-4 max-w-xl">
          <KronosSkeleton variant="line" width="40%" height={11} />
          <KronosSkeleton variant="block" height={44} rounded={10} />
          <KronosSkeleton variant="line" width="40%" height={11} />
          <KronosSkeleton variant="block" height={44} rounded={10} />
          <KronosSkeleton variant="line" width="40%" height={11} />
          <KronosSkeleton variant="block" height={120} rounded={10} />
          <div className="flex justify-end">
            <KronosSkeleton
              variant="block"
              width={120}
              height={40}
              rounded={10}
            />
          </div>
        </div>
      )}

      {/* Table */}
      {showTable && (
        <div className="k-card overflow-hidden">
          {/* Table header */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b"
            style={{ borderColor: "var(--line)" }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <KronosSkeleton
                key={i}
                variant="line"
                width={80 + i * 20}
                height={10}
              />
            ))}
          </div>
          {/* Table rows */}
          {Array.from({ length: tableRows }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
              style={{ borderColor: "var(--line)" }}
            >
              <KronosSkeleton
                variant="circle"
                width={28}
                height={28}
                delay={i * 40}
              />
              <KronosSkeleton
                variant="line"
                width="25%"
                height={11}
                delay={i * 40 + 20}
              />
              <KronosSkeleton
                variant="line"
                width="20%"
                height={11}
                delay={i * 40 + 40}
              />
              <KronosSkeleton
                variant="line"
                width="15%"
                height={11}
                delay={i * 40 + 60}
              />
              <div className="ml-auto flex gap-2">
                <KronosSkeleton
                  variant="line"
                  width={24}
                  height={24}
                  rounded={6}
                  delay={i * 40 + 80}
                />
                <KronosSkeleton
                  variant="line"
                  width={24}
                  height={24}
                  rounded={6}
                  delay={i * 40 + 100}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
