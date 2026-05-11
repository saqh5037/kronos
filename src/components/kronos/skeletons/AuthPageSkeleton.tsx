"use client";

import { KronosSkeleton } from "@/components/kronos/KronosSkeleton";

export default function AuthPageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo area */}
        <div className="flex justify-center py-4">
          <KronosSkeleton variant="line" width={120} height={24} />
        </div>

        {/* Card */}
        <div className="k-card p-6 space-y-5">
          <div className="space-y-2">
            <KronosSkeleton variant="line" width="70%" height={20} />
            <KronosSkeleton variant="line" width="90%" height={12} />
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <KronosSkeleton variant="line" width={60} height={10} />
              <KronosSkeleton variant="block" height={44} rounded={10} />
            </div>
            <div className="space-y-1.5">
              <KronosSkeleton variant="line" width={80} height={10} />
              <KronosSkeleton variant="block" height={44} rounded={10} />
            </div>
            <div className="space-y-1.5">
              <KronosSkeleton variant="line" width={100} height={10} />
              <KronosSkeleton variant="block" height={44} rounded={10} />
            </div>
          </div>

          {/* Button */}
          <KronosSkeleton variant="block" height={48} rounded={12} />

          {/* Footer */}
          <div className="flex justify-center pt-2">
            <KronosSkeleton variant="line" width={180} height={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
