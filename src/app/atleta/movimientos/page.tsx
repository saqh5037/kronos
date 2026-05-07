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
    <div className="pb-28 relative">
      {/* HERO V3 — limpio */}
      <header
        style={{
          padding: "56px 20px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
          }}
        >
          MOVIMIENTOS · ATLETA
        </span>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--k-t1)",
            margin: 0,
            lineHeight: 1.05,
          }}
        >
          Tu biblioteca técnica
        </h1>
        <p
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--k-accent)",
            margin: "4px 0 0",
          }}
        >
          {movements.length} entrenados · 90 días
        </p>
      </header>

      {/* List — personal movements */}
      <AnimatedSection className="px-3.5 mt-2 space-y-2">
        {movements.length === 0 && (
          <AnimatedItem>
            <KCard variant="ghost" className="p-6 text-center">
              <p className="text-sm text-[var(--text-2)]">
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
                <div className="font-display text-sm font-bold w-5 text-center text-[var(--text-3)]">
                  {i + 1}
                </div>

                {/* Name + badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold truncate text-[var(--text)]">
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
                      <span className="text-[10px] font-mono font-bold text-[var(--text-3)]">
                        {m.frequency90d}×
                      </span>
                    </div>
                    {m.daysSinceLastAttempt !== null && (
                      <span className="text-[10px] text-[var(--text-3)]">
                        Hace {m.daysSinceLastAttempt}d
                      </span>
                    )}
                  </div>
                </div>

                {/* Current best */}
                <div className="text-right shrink-0">
                  {m.currentBest !== null ? (
                    <>
                      <div className="font-display text-sm font-bold text-[var(--text)]">
                        {m.currentBest} {m.unit}
                      </div>
                      <div className="text-[9px] font-bold tracking-wide mt-1 text-[var(--text-3)]">
                        PR ACTUAL
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-[var(--text-3)]">
                      Sin PR
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="text-lg opacity-30 text-[var(--text-3)]">›</div>
              </KCard>
            </Link>
          </AnimatedItem>
        ))}
      </AnimatedSection>

      {/* CATÁLOGO COMPLETO */}
      {catalog.length > 0 && (
        <AnimatedSection className="px-3.5 mt-8">
          <div className="flex items-baseline justify-between mb-4">
            <p className="k-eyebrow text-[var(--text-2)]">
              BIBLIOTECA DE MOVIMIENTOS
            </p>
            <span className="font-mono text-[10px] font-bold text-[var(--text-3)]">
              {catalog.length} MOVIMIENTOS
            </span>
          </div>
          <MovementCatalog movements={catalog} />
        </AnimatedSection>
      )}
    </div>
  );
}
