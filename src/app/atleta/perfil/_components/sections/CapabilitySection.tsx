/**
 * CapabilitySection — capability radar chart.
 *
 * Audit 2026-09-15 (P1 bug, /atleta/perfil): the radar plotted "Cardio 0" and
 * "Core 0" while Helen, Karen and Fran were on file. A category with no
 * movements on file has no score — `getMyCapabilityProfile` now returns `null`
 * for it, and this section keeps those categories OUT of the chart and names
 * them under it as "sin datos" instead of drawing them as a zero.
 *
 * Only categories with data reach `CapabilityRadar` (its contract is
 * `score: number`); the whole card is skipped when nothing has data.
 *
 * Optional: try/catch → null.
 */

import { getMyCapabilityProfile } from "@/server/analytics/capability";
import KCard from "@/components/kronos/KCard";
import { CapabilityRadar } from "@/components/charts/CapabilityRadar";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";

export async function CapabilitySection() {
  let capability = null;
  try {
    capability = await getMyCapabilityProfile();
  } catch {
    return null;
  }

  if (!capability || !capability.hasAnyData) return null;

  const withData = capability.categories.filter((c) => c.hasData);
  const withoutData = capability.categories.filter((c) => !c.hasData);

  // "Más fuerte / a mejorar" is a comparison — it needs at least two measured
  // categories to mean anything.
  const canCompare = withData.length >= 2;

  return (
    <AnimatedSection className="mt-5 px-3.5">
      <AnimatedItem>
        <KCard>
          <div className="p-4">
            <p className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
              PERFIL DE CAPACIDADES
            </p>
            <CapabilityRadar
              categories={withData.map((c) => ({
                category: c.category,
                name: c.name,
                score: c.score ?? 0,
                rawValue: c.rawValue,
                movementCount: c.movementCount,
              }))}
              overallRank={capability.overallRank ?? 0}
              totalAthletes={capability.totalAthletes}
              weakestCategory={canCompare ? capability.weakestCategory : null}
              strongestCategory={
                canCompare ? capability.strongestCategory : null
              }
              height={240}
            />
            {withoutData.length > 0 && (
              <p
                className="mt-3 text-[11px]"
                style={{
                  color: "var(--k-t3)",
                  fontFamily: "var(--k-font-body)",
                  lineHeight: 1.5,
                }}
              >
                Sin datos en {withoutData.map((c) => c.name).join(", ")} —
                registra un WOD de esas categorías para medirlas.
              </p>
            )}
          </div>
        </KCard>
      </AnimatedItem>
    </AnimatedSection>
  );
}
