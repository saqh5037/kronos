"use client";

import { KronosSkeleton } from "@/components/kronos/KronosSkeleton";

interface Props {
  centered?: boolean;
  showHeader?: boolean;
  lineCount?: number;
}

export default function SimplePageSkeleton({
  centered = false,
  showHeader = true,
  lineCount = 8,
}: Props) {
  const content = (
    <div className="space-y-4 max-w-3xl">
      {showHeader && (
        <div className="space-y-2 pb-4">
          <KronosSkeleton variant="line" width="60%" height={24} />
          <KronosSkeleton variant="line" width="40%" height={14} />
        </div>
      )}
      {Array.from({ length: lineCount }).map((_, i) => (
        <KronosSkeleton
          key={i}
          variant="line"
          width={i === lineCount - 1 ? "70%" : "100%"}
          height={12}
          delay={i * 40}
        />
      ))}
      <div className="pt-4">
        <KronosSkeleton variant="block" height={160} rounded={12} />
      </div>
    </div>
  );

  if (centered) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        {content}
      </div>
    );
  }

  return <div className="px-4 py-8 lg:px-8">{content}</div>;
}
