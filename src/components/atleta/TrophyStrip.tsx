"use client";

import { motion } from "framer-motion";

export type TrophyItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  earnedAt: Date | string | null;
  unlocked: boolean;
  /** Optional progress 0..1 for locked badges (teaser hint). */
  progress?: number;
};

interface TrophyStripProps {
  items: TrophyItem[];
  /**
   * If true, shows an empty state CTA when no badges have been earned yet.
   */
  emptyHint?: string;
}

export function TrophyStrip({ items, emptyHint }: TrophyStripProps) {
  const sorted = [...items].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    return 0;
  });

  if (sorted.length === 0) {
    return (
      <div
        className="k-card"
        style={{
          padding: 16,
          textAlign: "center",
          color: "var(--k-t2)",
          fontFamily: "var(--k-font-body)",
          fontSize: 13,
        }}
      >
        {emptyHint ?? "Aún sin logros. Tu primera clase desbloquea el primero."}
      </div>
    );
  }

  return (
    <div
      data-testid="trophy-strip"
      style={{
        display: "flex",
        gap: 10,
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        padding: "4px 2px",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {sorted.map((t, i) => (
        <TrophyCard key={t.id} item={t} index={i} />
      ))}
    </div>
  );
}

function TrophyCard({ item, index }: { item: TrophyItem; index: number }) {
  const locked = !item.unlocked;
  const initial =
    item.code
      .split("-")
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "★";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
      className="k-card"
      style={{
        flex: "0 0 auto",
        width: 140,
        padding: 12,
        scrollSnapAlign: "start",
        position: "relative",
        background: locked ? "var(--k-surface)" : "var(--k-elevated)",
        opacity: locked ? 0.55 : 1,
        borderColor: locked ? "var(--k-line)" : "var(--k-accent-line)",
      }}
      data-testid="trophy-card"
      data-locked={locked}
    >
      <div
        aria-hidden="true"
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: locked ? "var(--k-line-2)" : "var(--k-accent-soft)",
          border: `1px solid ${locked ? "var(--k-line)" : "var(--k-accent-line)"}`,
          display: "grid",
          placeItems: "center",
          color: locked ? "var(--k-t3)" : "var(--k-accent)",
          fontFamily: "var(--k-font-display)",
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 8,
          boxShadow: locked ? undefined : "var(--k-accent-glow)",
        }}
      >
        {locked ? <LockIcon /> : initial}
      </div>
      <div
        className="k-mono"
        style={{
          fontSize: 9,
          color: locked ? "var(--k-t3)" : "var(--k-accent)",
          letterSpacing: 1.2,
          marginBottom: 4,
        }}
      >
        {locked ? "BLOQUEADO" : "DESBLOQUEADO"}
      </div>
      <div
        style={{
          fontFamily: "var(--k-font-body)",
          fontSize: 13,
          color: "var(--k-t1)",
          fontWeight: 600,
          lineHeight: 1.2,
          marginBottom: 2,
        }}
      >
        {item.name}
      </div>
      <div
        style={{
          fontFamily: "var(--k-font-body)",
          fontSize: 11,
          color: "var(--k-t2)",
          lineHeight: 1.3,
          minHeight: 28,
        }}
      >
        {item.description}
      </div>
      {locked && typeof item.progress === "number" && (
        <div
          style={{
            marginTop: 8,
            height: 4,
            width: "100%",
            background: "var(--k-line)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, Math.max(0, item.progress * 100))}%`,
              background: "var(--k-accent)",
              transition: "width 400ms ease",
            }}
          />
        </div>
      )}
    </motion.div>
  );
}

function LockIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
