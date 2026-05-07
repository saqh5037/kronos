import Link from "next/link";
import type { Route } from "next";
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
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-3)]">
            Top {rows.length}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="py-2">
          <p className="text-sm text-[var(--moss)]">
            ✓ Ningún atleta en riesgo esta semana.
          </p>
          <p className="text-xs text-[var(--text-3)] mt-1">
            Tu equipo viene parejo. Mantené el tono.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.athleteId}
              className="flex flex-col gap-1 pb-3 border-b border-[var(--line)] last:border-b-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/admin/atletas/${r.athleteId}` as Route}
                  className="font-bold text-sm hover:text-[var(--strain)] transition-colors"
                >
                  {r.name}
                </Link>
                <span className={`k-chip ${SEVERITY_CHIP[r.severity]}`}>
                  {SEVERITY_LABEL[r.severity]}
                </span>
              </div>
              <p className="text-xs text-[var(--text-3)]">
                {r.reasons.join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </KCard>
  );
}
