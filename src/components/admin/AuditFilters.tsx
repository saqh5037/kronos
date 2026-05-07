"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AUDIT_CATEGORIES,
  AUDIT_CATEGORY_LABELS,
  type AuditCategory,
} from "@/lib/audit-humanize";

const DAYS_FILTERS = [
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
  const currentCategory = searchParams.get("category") as AuditCategory | null;

  function setDays(days: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", String(days));
    router.push(`?${params.toString()}`);
  }

  function setCategory(category: AuditCategory | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (category === null) {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex items-center bg-[var(--card-2)] rounded-full p-1 border border-[var(--line)]">
          {DAYS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setDays(f.value)}
              className={`relative z-10 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                currentDays === f.value
                  ? "text-text"
                  : "text-text-2 hover:text-text-2"
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

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className="px-3 py-1 rounded-full text-xs font-bold transition-colors"
          style={{
            background: !currentCategory ? "var(--grad)" : "var(--card-2)",
            color: !currentCategory ? "#0a0a0c" : "var(--text-2)",
            border: !currentCategory ? "none" : "1px solid var(--line)",
          }}
        >
          Todo
        </button>
        {AUDIT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className="px-3 py-1 rounded-full text-xs font-bold transition-colors"
            style={{
              background:
                currentCategory === cat ? "var(--grad)" : "var(--card-2)",
              color: currentCategory === cat ? "#0a0a0c" : "var(--text-2)",
              border:
                currentCategory === cat ? "none" : "1px solid var(--line)",
            }}
          >
            {AUDIT_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
    </div>
  );
}
