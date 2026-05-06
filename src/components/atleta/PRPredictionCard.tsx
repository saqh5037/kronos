import { AnimatedItem } from "@/components/kronos/AnimatedSection";
import type { PRPredictionCard as PRPredictionCardData } from "@/server/actions/ai";

const AI_PRIMARY = "#ff2bd6";
const AI_SECONDARY = "#00e5ff";

type StatusStyle = {
  accent: string;
  glow: string;
  label: string;
};

const STATUS_STYLES: Record<PRPredictionCardData["status"], StatusStyle> = {
  improving: {
    accent: "#4a7c59",
    glow: "rgba(74, 124, 89, 0.32)",
    label: "EN ALZA",
  },
  plateau: {
    accent: "#d97706",
    glow: "rgba(217, 119, 6, 0.30)",
    label: "PLATEAU",
  },
  declining: {
    accent: "#c44536",
    glow: "rgba(196, 69, 54, 0.30)",
    label: "BAJANDO",
  },
  insufficient: {
    accent: "#64748b",
    glow: "rgba(100, 116, 139, 0.20)",
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

  return (
    <AnimatedItem>
      <div
        className="relative overflow-hidden rounded-[14px] p-4"
        style={{
          background: "var(--card)",
          border: "1px solid var(--line-strong)",
          boxShadow:
            card.source === "ai"
              ? `0 0 0 1px ${AI_PRIMARY}33, 0 6px 22px ${AI_PRIMARY}1a`
              : `0 0 0 1px ${status.glow}, 0 4px 16px ${status.glow}`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              card.source === "ai"
                ? `radial-gradient(circle at 0% 100%, ${AI_PRIMARY}1a 0%, transparent 60%), radial-gradient(circle at 100% 0%, ${AI_SECONDARY}14 0%, transparent 55%)`
                : "transparent",
          }}
        />
        <div className="relative">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <div className="font-display text-[15px] font-bold tracking-tight">
              {card.movementName}
            </div>
            <span
              className="font-mono text-[9px] tracking-[0.16em] font-bold uppercase"
              style={{ color: status.accent }}
            >
              {status.label}
            </span>
          </div>

          {showPrediction ? (
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className="font-display text-[28px] font-extrabold leading-none"
                style={{
                  color: card.source === "ai" ? AI_PRIMARY : "var(--text)",
                }}
              >
                {card.predictedKg}
              </span>
              <span
                className="font-mono text-[10px] font-bold tracking-[0.1em]"
                style={{ color: "var(--text-2)" }}
              >
                {card.unit.toUpperCase()}
              </span>
              <span
                className="font-mono text-[10px] font-bold tracking-[0.08em]"
                style={{ color: "var(--text-3)" }}
              >
                · EN {card.weeksFromNow} SEM
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className="font-display text-[24px] font-extrabold leading-none"
                style={{ color: "var(--text-2)" }}
              >
                —
              </span>
              <span
                className="font-mono text-[10px] font-bold tracking-[0.1em]"
                style={{ color: "var(--text-3)" }}
              >
                ACTUAL {card.currentBest} {card.unit.toUpperCase()}
              </span>
            </div>
          )}

          <p
            className="text-[12px] leading-[1.45] mt-2"
            style={{ color: "var(--text-2)" }}
          >
            {card.narrative}
          </p>

          {showPrediction && card.confidence > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <div
                className="h-1 flex-1 rounded-full overflow-hidden"
                style={{ background: "var(--track)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${confidencePct}%`,
                    background:
                      card.source === "ai"
                        ? `linear-gradient(90deg, ${AI_PRIMARY}, ${AI_SECONDARY})`
                        : status.accent,
                  }}
                />
              </div>
              <span
                className="font-mono text-[9px] tracking-[0.12em] font-bold"
                style={{ color: "var(--text-3)" }}
              >
                {confidencePct}% CONFIANZA
              </span>
            </div>
          )}

          {card.source === "ai" && (
            <div className="mt-2.5 flex items-center gap-1.5">
              <span
                className="font-mono text-[8px] tracking-[0.18em] font-bold uppercase"
                style={{ color: AI_PRIMARY }}
              >
                Kronos AI
              </span>
              <span
                aria-hidden
                className="h-0.5 w-0.5 rounded-full"
                style={{ background: AI_SECONDARY }}
              />
            </div>
          )}
        </div>
      </div>
    </AnimatedItem>
  );
}
