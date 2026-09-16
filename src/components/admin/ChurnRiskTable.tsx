import Link from "next/link";
import type { Route } from "next";
import type { ChurnRiskRow } from "@/server/analytics/churn";
import { AT_RISK_REASONS } from "@/server/period-summary/rules";

/**
 * Churn severity is intensity of one thing, so it is one hue at three opacities
 * (audit 2026-09-15, S2) — and no `var()` carries an alpha suffix, which is not
 * valid CSS.
 */
const SEVERITY_OPACITY: Record<ChurnRiskRow["severity"], number> = {
  high: 1,
  med: 0.7,
  low: 0.45,
};

const SEVERITY_LABEL: Record<ChurnRiskRow["severity"], string> = {
  high: "ALTO",
  med: "MEDIO",
  low: "BAJO",
};

export default function ChurnRiskTable({ rows }: { rows: ChurnRiskRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="k-card p-6 text-center">
        <p className="text-sm" style={{ color: "var(--k-t2)" }}>
          Sin atletas en riesgo de abandono — todo bajo control.
        </p>
      </div>
    );
  }

  return (
    <div className="k-card overflow-hidden">
      {/* The column header only exists while there ARE columns: under `sm`
          the row stacks, and at 360 this header printed "SEVERIDADSEÑALES"
          over names truncated to "Andrés…" with the action clipped off the
          card (visual gate, fase 0). */}
      <div className="hidden sm:grid grid-cols-12 gap-3 border-b border-[var(--k-line)] px-4 py-2.5 text-[10px] font-mono font-bold tracking-[0.12em] uppercase text-[var(--k-t3)]">
        <div className="col-span-3">Atleta</div>
        <div className="col-span-2">Severidad</div>
        <div className="col-span-5">Señales</div>
        <div className="col-span-2 text-right">Acción</div>
      </div>
      {rows.map((row) => (
        <div
          key={row.athleteId}
          className="flex flex-col gap-2 border-b border-[var(--k-line)] px-4 py-3 last:border-b-0 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center"
        >
          <div className="min-w-0 sm:col-span-3">
            <p className="font-display text-sm font-bold truncate">
              {row.name}
            </p>
            {row.daysSinceLastAttended !== null && (
              <p className="font-mono text-[10px] text-[var(--k-t3)] mt-0.5">
                {row.daysSinceLastAttended === 0
                  ? "asistió hoy"
                  : `${row.daysSinceLastAttended}d desde última asistencia`}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <span
              className="font-mono text-[10px] tracking-[0.16em] font-bold uppercase px-2 py-0.5 rounded-md inline-block whitespace-nowrap"
              style={{
                color: "var(--k-accent)",
                opacity: SEVERITY_OPACITY[row.severity],
                background: "var(--k-surface)",
                border: "1px solid var(--k-accent-line)",
              }}
            >
              {SEVERITY_LABEL[row.severity]} · {row.signalCount}/
              {AT_RISK_REASONS.length}
            </span>
          </div>
          <div className="sm:col-span-5">
            <ul className="text-[12px] leading-[1.4] text-[var(--k-t2)] space-y-0.5">
              {row.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span
                    aria-hidden
                    className="mt-1 h-1 w-1 rounded-full flex-shrink-0"
                    style={{
                      background: "var(--k-accent)",
                      opacity: SEVERITY_OPACITY[row.severity],
                    }}
                  />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="sm:col-span-2 sm:text-right">
            <Link
              href={`/admin/atletas/${row.athleteId}` as Route}
              className="k-chip inline-flex items-center gap-1 hover:scale-[1.04] transition-transform"
              style={{
                background: "var(--k-surface)",
                border: "1px solid var(--k-line-2)",
                fontSize: 10,
                padding: "4px 10px",
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Contactar
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
