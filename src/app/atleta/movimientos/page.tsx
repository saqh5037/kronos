import Link from "next/link";
import type { Route } from "next";
import {
  listMyMovementsRated,
  type RankedMovement,
} from "@/server/analytics/movement";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import KCard from "@/components/kronos/KCard";

export const metadata = { title: "Kronos — Mis Movimientos" };

export default async function MovementsPage() {
  let movements: RankedMovement[] = [];
  try {
    movements = await listMyMovementsRated(50);
  } catch {
    // unauthorized
  }

  return (
    <div className="pb-28">
      {/* Header */}
      <AnimatedSection className="px-[18px] pt-14 pb-3">
        <AnimatedItem>
          <p className="k-eyebrow mb-1">MIS MOVIMIENTOS</p>
          <h1 className="font-display font-bold text-2xl">Movimientos</h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
            {movements.length} movimientos entrenados en los últimos 90 días
          </p>
        </AnimatedItem>
      </AnimatedSection>

      {/* List */}
      <AnimatedSection className="px-3.5 mt-2 space-y-2">
        {movements.length === 0 && (
          <AnimatedItem>
            <KCard variant="ghost" className="p-6 text-center">
              <p className="text-sm" style={{ color: "var(--text-2)" }}>
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
                <div
                  className="font-display text-sm font-bold w-5 text-center"
                  style={{ color: "var(--text-3)" }}
                >
                  {i + 1}
                </div>

                {/* Name + badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold truncate">
                      {m.movementName}
                    </span>
                    {m.isStale && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{
                          background: "var(--ember-soft)",
                          color: "var(--ember)",
                        }}
                      >
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
                      <span
                        className="text-[10px] font-mono font-bold"
                        style={{ color: "var(--text-3)" }}
                      >
                        {m.frequency90d}×
                      </span>
                    </div>
                    {m.daysSinceLastAttempt !== null && (
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--text-3)" }}
                      >
                        Hace {m.daysSinceLastAttempt}d
                      </span>
                    )}
                  </div>
                </div>

                {/* Current best */}
                <div className="text-right shrink-0">
                  {m.currentBest !== null ? (
                    <>
                      <div className="font-display text-sm font-bold">
                        {m.currentBest} {m.unit}
                      </div>
                      <div
                        className="text-[9px] font-bold tracking-wide"
                        style={{ color: "var(--text-3)" }}
                      >
                        PR ACTUAL
                      </div>
                    </>
                  ) : (
                    <div
                      className="text-[11px]"
                      style={{ color: "var(--text-3)" }}
                    >
                      Sin PR
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div
                  className="text-lg opacity-30"
                  style={{ color: "var(--text-3)" }}
                >
                  ›
                </div>
              </KCard>
            </Link>
          </AnimatedItem>
        ))}
      </AnimatedSection>
    </div>
  );
}
