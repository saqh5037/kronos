import type { WODSummary } from "@/server/actions/wods";

const TYPE_COLOR: Record<string, string> = {
  STRENGTH: "var(--k-warning)",
  AMRAP: "var(--k-warning)",
  EMOM: "var(--k-danger)",
  TABATA: "#f5a623",
  FORTIME: "var(--k-accent)",
  METCON: "var(--k-accent)",
};

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

export function WODHeroCard({ w }: { w: WODSummary }) {
  const accent = TYPE_COLOR[w.type] ?? "var(--text)";
  const typeLabel = TYPE_LABEL[w.type] ?? w.type;
  const scoreLabel = SCORE_TYPE_LABEL[w.scoreType] ?? w.scoreType;

  return (
    <article
      className="rounded-2xl p-5 relative overflow-hidden transition-all hover:scale-[1.005]"
      style={{
        background: "var(--card)",
        border: `1px solid ${accent}30`,
        boxShadow: `0 0 0 1px ${accent}10, 0 4px 20px ${accent}08, inset 0 0 60px ${accent}06`,
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
          background: `radial-gradient(circle at 0% 0%, ${accent}10, transparent 50%)`,
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
                background: `${accent}18`,
                color: accent,
                border: `1px solid ${accent}35`,
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
                border: "1px solid var(--line)",
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
            style={{ color: "var(--text)" }}
          >
            {w.description}
          </pre>
        )}

        {/* Footer */}
        <div
          className="flex items-center gap-3 pt-3 border-t font-mono text-[10px] font-bold uppercase tracking-wider"
          style={{
            borderColor: "var(--line)",
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
