import type { WODSummary } from "@/server/actions/wods";
import { scoreTypeLabel, wodTypeLabel } from "@/lib/labels";
import { formatDateShort } from "@/lib/format";

/**
 * WOD card for the admin library (audit 2026-09-15, /admin/wods P1).
 *
 * Monochrome on purpose: the shared `WODHeroCard` coloured the title by type
 * (STRENGTH orange, EMOM red), so "Death by Burpees" was red because of its
 * format, not because anything was wrong. Type is a chip, rendered once, and
 * the score type is named in Spanish instead of leaking HEAVIEST / ROUNDS_REPS.
 */
export function WodCard({ w }: { w: WODSummary }) {
  return (
    <article
      className="rounded-2xl p-5 transition-colors"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-line)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <h3
            className="font-display font-extrabold text-2xl uppercase tracking-tight leading-none"
            style={{ color: "var(--k-t1)", letterSpacing: "-0.01em" }}
          >
            {w.name}
          </h3>
          <span
            className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase"
            style={{
              background: "var(--k-accent-soft)",
              color: "var(--k-accent)",
              border: "1px solid var(--k-accent-line)",
            }}
          >
            {wodTypeLabel[w.type]}
          </span>
        </div>
        {w.timeCap && (
          <span
            className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase"
            style={{
              background: "var(--k-elevated)",
              color: "var(--k-t2)",
              border: "1px solid var(--k-line-2)",
            }}
          >
            {w.timeCap} min de cap
          </span>
        )}
      </div>

      <p
        className="font-mono text-[10px] font-bold uppercase tracking-wider mb-3"
        style={{ color: "var(--k-t2)" }}
      >
        Se mide en {scoreTypeLabel[w.scoreType].toLowerCase()}
      </p>

      {w.description && (
        <pre
          className="text-[12.5px] leading-[1.55] font-sans whitespace-pre-wrap mb-4"
          style={{ color: "var(--k-t1)" }}
        >
          {w.description}
        </pre>
      )}

      <div
        className="flex items-center gap-3 pt-3 border-t font-mono text-[10px] font-bold uppercase tracking-wider"
        style={{ borderColor: "var(--k-line)", color: "var(--k-t2)" }}
      >
        <span>
          {w.movementCount} movimiento{w.movementCount === 1 ? "" : "s"}
        </span>
        <span aria-hidden>·</span>
        <span>Creado {formatDateShort(new Date(w.createdAt))}</span>
      </div>
    </article>
  );
}
