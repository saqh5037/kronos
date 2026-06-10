import { AnimatedItem } from "@/components/kronos/AnimatedSection";
import type { PRPredictionCard as PRPredictionCardData } from "@/server/actions/ai";

type StatusStyle = {
  accent: string;
  glow: string;
  label: string;
};

// V3 — lima neon monochrome; intensity via opacity only
const STATUS_STYLES: Record<PRPredictionCardData["status"], StatusStyle> = {
  improving: {
    accent: "var(--k-accent)",
    glow: "rgba(200, 255, 45, 0.22)",
    label: "EN ALZA",
  },
  plateau: {
    accent: "var(--k-accent)",
    glow: "rgba(200, 255, 45, 0.16)",
    label: "PLATEAU",
  },
  declining: {
    accent: "var(--k-accent)",
    glow: "rgba(200, 255, 45, 0.20)",
    label: "BAJANDO",
  },
  insufficient: {
    accent: "var(--k-t3)",
    glow: "rgba(200, 255, 45, 0.08)",
    label: "POCOS DATOS",
  },
};

export default function PRPredictionCard({
  card,
}: {
  card: PRPredictionCardData;
}) {
  const status = STATUS_STYLES[card.status];
  const showPrediction =
    card.status === "improving" || card.status === "plateau";
  const confidencePct = Math.round(card.confidence * 100);
  const isAI = card.source === "ai";

  return (
    <AnimatedItem>
      <div
        className="k-card-brand relative"
        style={{
          boxShadow: isAI
            ? `0 0 0 1px var(--blue-line), 0 12px 36px ${status.glow}`
            : `0 0 0 1px ${status.glow}, 0 6px 22px ${status.glow}`,
        }}
      >
        <span className="k-corner-tl" aria-hidden />
        <span className="k-corner-br" aria-hidden />

        <div className="relative">
          <div className="flex items-baseline justify-between gap-2 mb-2.5">
            <div className="font-display text-[18px] font-bold tracking-[-0.01em]">
              {card.movementName}
            </div>
            <span
              className="font-mono text-[9px] tracking-[0.18em] font-bold uppercase px-2 py-0.5 rounded-md inline-block"
              style={{
                color: status.accent,
                background: "var(--k-surface)",
                border: `1px solid ${status.accent}55`,
              }}
            >
              {status.label}
            </span>
          </div>

          {showPrediction ? (
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className="font-display font-extrabold text-[36px] leading-none tracking-[-0.02em] k-h-italic"
                style={{
                  color: isAI ? "transparent" : "var(--text)",
                  background: isAI ? "var(--k-accent)" : "transparent",
                  WebkitBackgroundClip: isAI ? "text" : "border-box",
                  backgroundClip: isAI ? "text" : "border-box",
                }}
              >
                <em>{card.predictedKg}</em>
              </span>
              <span
                className="font-mono text-[11px] font-bold tracking-[0.1em] uppercase"
                style={{ color: "var(--k-t2)" }}
              >
                {card.unit}
              </span>
              <span
                className="font-mono text-[10px] font-bold tracking-[0.08em]"
                style={{ color: "var(--k-t3)" }}
              >
                · en {card.weeksFromNow} sem
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className="font-display text-[28px] font-extrabold leading-none"
                style={{ color: "var(--k-t2)" }}
              >
                —
              </span>
              <span
                className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase"
                style={{ color: "var(--k-t3)" }}
              >
                actual {card.currentBest} {card.unit}
              </span>
            </div>
          )}

          <p
            className="text-[13px] leading-[1.5] mt-2.5"
            style={{ color: "var(--k-t2)" }}
          >
            {card.narrative}
          </p>

          {showPrediction && card.confidence > 0 && (
            <div className="flex items-center gap-2.5 mt-3.5">
              <div
                className="h-1 flex-1 rounded-full overflow-hidden"
                style={{ background: "var(--track)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${confidencePct}%`,
                    background: isAI ? "var(--k-accent)" : status.accent,
                  }}
                />
              </div>
              <span
                className="font-mono text-[9px] tracking-[0.14em] font-bold uppercase"
                style={{ color: "var(--k-t3)" }}
              >
                {confidencePct}% confianza
              </span>
            </div>
          )}

          {isAI && (
            <div className="mt-3 flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-[1.5px] w-5"
                style={{ background: "var(--k-accent)" }}
              />
              <span
                className="font-mono text-[8px] tracking-[0.22em] font-bold uppercase"
                style={{ color: "var(--k-accent)" }}
              >
                Kronos AI
              </span>
            </div>
          )}
        </div>
      </div>
    </AnimatedItem>
  );
}
