import Link from "next/link";
import type { Route } from "next";
import { Check, ChevronRight } from "lucide-react";
import KCard from "@/components/kronos/KCard";
import type { AthleteAtRiskRow } from "@/server/owner-digest/compute";

const SEVERITY_LABEL = {
  high: "Alto",
  med: "Medio",
  low: "Bajo",
} as const;

const SEVERITY_CHIP = {
  high: "k-chip-pr",
  med: "k-chip-strain",
  low: "k-chip-ghost",
} as const;

type Props = {
  rows: AthleteAtRiskRow[];
};

export function AtRiskCard({ rows }: Props) {
  return (
    <KCard animate={false} className="p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="font-display text-xl font-bold">Atletas en riesgo</h2>
        {rows.length > 0 && (
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--k-t2)]">
            Top {rows.length}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="py-2">
          <p className="inline-flex items-center gap-1.5 text-sm text-[var(--k-accent)]">
            <Check size={16} aria-hidden />
            Ningún atleta en riesgo esta semana.
          </p>
          <p className="text-xs text-[var(--k-t2)] mt-1">
            Tu equipo viene parejo. Mantén el ritmo.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.athleteId}
              className="flex flex-col gap-1 pb-3 border-b border-[var(--k-line)] last:border-b-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/admin/atletas/${r.athleteId}` as Route}
                  className="inline-flex min-h-11 items-center gap-1 font-bold text-sm hover:text-[var(--k-accent)] transition-colors"
                >
                  {r.name}
                  <ChevronRight size={14} aria-hidden />
                </Link>
                <span className={`k-chip ${SEVERITY_CHIP[r.severity]}`}>
                  {SEVERITY_LABEL[r.severity]}
                </span>
              </div>
              <p className="text-xs text-[var(--k-t2)]">
                {r.reasons.join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </KCard>
  );
}
