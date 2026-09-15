import type { WODSummary } from "@/server/actions/wods";

/**
 * WOD type is a category, not a severity: colouring TABATA orange and EMOM red
 * told the athlete something was wrong (audit 2026-09-15, S2). The type now
 * reads as a chip with a word; the accent stays lime everywhere.
 */

const TYPE_LABEL: Record<string, string> = {
  STRENGTH: "Strength",
  AMRAP: "AMRAP",
  EMOM: "EMOM",
  TABATA: "Tabata",
  FORTIME: "For Time",
  METCON: "MetCon",
};

const SCORE_TYPE_LABEL: Record<string, string> = {
  TIME: "For Time",
  ROUNDS: "AMRAP",
  REPS: "Reps",
  WEIGHT: "Heaviest",
};

/** Lime as raw channels, so alpha can be applied without string-concatenating
 *  onto a `var()` (which is not valid CSS). */
const LIME = "200, 255, 45";
const lime = (alpha: number) => `rgba(${LIME}, ${alpha})`;

export function WODHeroCard({ w }: { w: WODSummary }) {
  const accent = "var(--k-accent)";
  const typeLabel = TYPE_LABEL[w.type] ?? w.type;
  const scoreLabel = SCORE_TYPE_LABEL[w.scoreType] ?? w.scoreType;

  return (
    <article
      className="rounded-2xl p-5 relative overflow-hidden transition-all hover:scale-[1.005]"
      style={{
        background: "var(--k-surface)",
        border: `1px solid ${lime(0.18)}`,
        boxShadow: `0 4px 20px ${lime(0.05)}`,
      }}
    >
      {/* Top accent bar */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{
          background: `linear-gradient(90deg, ${accent}, transparent)`,
        }}
      />
      <div
        aria-hidden
        className="absolute -inset-px pointer-events-none rounded-2xl"
        style={{
          background: `radial-gradient(circle at 0% 0%, ${lime(0.06)}, transparent 50%)`,
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="font-display font-extrabold text-2xl uppercase tracking-tight leading-none"
              style={{
                color: accent,
                letterSpacing: "-0.01em",
              }}
            >
              {w.name}
            </h3>
            <span
              className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1"
              style={{
                background: "var(--k-accent-soft)",
                color: accent,
                border: "1px solid var(--k-accent-line)",
              }}
            >
              {typeLabel}
            </span>
          </div>
          {w.timeCap && (
            <span
              className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase"
              style={{
                background: "var(--k-elevated)",
                color: "var(--k-t2)",
                border: "1px solid var(--k-line)",
              }}
            >
              {w.timeCap} min cap
            </span>
          )}
        </div>

        {/* Score type */}
        <div className="flex items-center gap-1.5 mb-3">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: accent }}
          />
          <p
            className="font-mono text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--k-t2)" }}
          >
            {scoreLabel}
          </p>
        </div>

        {/* Description (structured) */}
        {w.description && (
          <pre
            className="text-[12.5px] leading-[1.55] font-sans whitespace-pre-wrap mb-4"
            style={{ color: "var(--k-t1)" }}
          >
            {w.description}
          </pre>
        )}

        {/* Footer */}
        <div
          className="flex items-center gap-3 pt-3 border-t font-mono text-[10px] font-bold uppercase tracking-wider"
          style={{
            borderColor: "var(--k-line)",
            color: "var(--k-t3)",
          }}
        >
          <span>
            {w.movementCount} movimiento{w.movementCount === 1 ? "" : "s"}
          </span>
          <span className="opacity-40">·</span>
          <span>
            {new Date(w.createdAt).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "short",
            })}
          </span>
        </div>
      </div>
    </article>
  );
}
