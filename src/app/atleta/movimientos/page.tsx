import Link from "next/link";
import type { Route } from "next";
import {
  listMyMovementsRated,
  type RankedMovement,
} from "@/server/analytics/movement";
import { listMovements, type MovementRow } from "@/server/actions/movements";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import KCard from "@/components/kronos/KCard";
import MovementCatalog from "@/components/atleta/MovementCatalog";

export const metadata = { title: "Kronos — Mis Movimientos" };

export default async function MovementsPage() {
  let movements: RankedMovement[] = [];
  let catalog: MovementRow[] = [];
  try {
    [movements, catalog] = await Promise.all([
      listMyMovementsRated(50),
      listMovements(),
    ]);
  } catch {
    // unauthorized
  }

  return (
    <div className="pb-28">
      {/* Header */}
      <AnimatedSection className="px-[18px] pt-14 pb-3">
        <AnimatedItem>
          <p className="k-eyebrow mb-1">MIS MOVIMIENTOS</p>
          <h1 className="font-display font-bold text-2xl text-white">
            Movimientos
          </h1>
          <p className="text-xs mt-1 text-white/50">
            {movements.length} movimientos entrenados en los últimos 90 días
          </p>
        </AnimatedItem>
      </AnimatedSection>

      {/* List — personal movements */}
      <AnimatedSection className="px-3.5 mt-2 space-y-2">
        {movements.length === 0 && (
          <AnimatedItem>
            <KCard variant="ghost" className="p-6 text-center">
              <p className="text-sm text-white/60">
                Aún no has registrado scores. Empieza entrenando y tus
                movimientos aparecerán aquí.
              </p>
            </KCard>
          </AnimatedItem>
        )}

        {movements.map((m, i) => (
          <AnimatedItem key={m.movementId}>
            <Link href={`/atleta/movimientos/${m.movementId}` as Route}>
              <KCard
                variant="ghost"
                className="p-3.5 flex items-center gap-3"
                animate={true}
              >
                {/* Rank */}
                <div className="font-display text-sm font-bold w-5 text-center text-white/30">
                  {i + 1}
                </div>

                {/* Name + badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold truncate text-white">
                      {m.movementName}
                    </span>
                    {m.isStale && (
                      <span className="k-chip k-chip-pr text-[9px] py-0.5 px-1.5">
                        SIN ENTRENAR
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Frequency bar */}
                    <div className="flex items-center gap-1.5 flex-1 max-w-[120px]">
                      <div
                        className="h-1.5 rounded-full flex-1"
                        style={{ background: "var(--track)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (m.frequency90d / 20) * 100)}%`,
                            background: m.isStale
                              ? "var(--ember)"
                              : "var(--moss)",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-white/30">
                        {m.frequency90d}×
                      </span>
                    </div>
                    {m.daysSinceLastAttempt !== null && (
                      <span className="text-[10px] text-white/30">
                        Hace {m.daysSinceLastAttempt}d
                      </span>
                    )}
                  </div>
                </div>

                {/* Current best */}
                <div className="text-right shrink-0">
                  {m.currentBest !== null ? (
                    <>
                      <div className="font-display text-sm font-bold text-white">
                        {m.currentBest} {m.unit}
                      </div>
                      <div className="text-[9px] font-bold tracking-wide mt-1 text-white/30">
                        PR ACTUAL
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-white/30">Sin PR</div>
                  )}
                </div>

                {/* Arrow */}
                <div className="text-lg opacity-30 text-white/30">›</div>
              </KCard>
            </Link>
          </AnimatedItem>
        ))}
      </AnimatedSection>

      {/* CATÁLOGO COMPLETO */}
      {catalog.length > 0 && (
        <AnimatedSection className="px-3.5 mt-8">
          <div className="flex items-baseline justify-between mb-4">
            <p className="k-eyebrow text-white/60">BIBLIOTECA DE MOVIMIENTOS</p>
            <span className="font-mono text-[10px] font-bold text-white/30">
              {catalog.length} MOVIMIENTOS
            </span>
          </div>
          <MovementCatalog movements={catalog} />
        </AnimatedSection>
      )}
    </div>
  );
}
