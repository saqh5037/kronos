"use client";

import { m } from "framer-motion";
import { Icon } from "./Icon";

interface ConfidenceBadgeProps {
  confidence: number;
  showCheck?: boolean;
  delay?: number;
}

type Tier = { label: string; opacity: number };

/**
 * AI match confidence. Low confidence is not an error and not a warning — it is
 * less of the same thing, so it reads as lime at lower opacity plus a word
 * (audit 2026-09-15, S2: warning/danger used decoratively).
 */
function tierFor(confidence: number): Tier {
  if (confidence >= 0.85) return { label: "Alta", opacity: 1 };
  if (confidence >= 0.5) return { label: "Media", opacity: 0.7 };
  return { label: "Baja", opacity: 0.4 };
}

export default function ConfidenceBadge({
  confidence,
  showCheck = false,
  delay = 0,
}: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);
  const tier = tierFor(confidence);

  return (
    <m.div
      className="flex items-center gap-1.5"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
    >
      <span
        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs font-bold"
        style={{
          background: "var(--k-accent-soft)",
          borderColor: "var(--k-accent-line)",
          color: "var(--k-accent)",
          opacity: tier.opacity,
        }}
        title={`Confianza ${tier.label.toLowerCase()} · ${pct}%`}
      >
        {showCheck && <Icon name="check" size={16} />}
        <span>
          {tier.label} · {pct}%
        </span>
      </span>
    </m.div>
  );
}
