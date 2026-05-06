"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

const FILTERS = [
  { label: "Hoy", value: 1 },
  { label: "3D", value: 3 },
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
];

export default function AuditFilters({
  sensitiveCount,
}: {
  sensitiveCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDays = Number(searchParams.get("days") ?? 1);

  function setDays(days: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", String(days));
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3 mb-6 flex-wrap">
      <div className="relative flex items-center bg-[var(--card-2)] rounded-full p-1 border border-[var(--line)]">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setDays(f.value)}
            className={`relative z-10 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              currentDays === f.value
                ? "text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {currentDays === f.value && (
              <motion.div
                layoutId="audit-filter-pill"
                className="absolute inset-0 bg-[var(--steel)] rounded-full"
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 30,
                }}
              />
            )}
            <span className="relative z-10">{f.label}</span>
          </button>
        ))}
      </div>

      {sensitiveCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="k-chip text-[var(--ember)] bg-[var(--ember-soft)] border-[var(--ember-line)]"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--ember)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--ember)]" />
          </span>
          {sensitiveCount} sensible{sensitiveCount !== 1 ? "s" : ""}
        </motion.div>
      )}
    </div>
  );
}
