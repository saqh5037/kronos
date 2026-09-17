/**
 * CapabilitySection — capability radar chart.
 *
 * Audit 2026-09-15 (P1 bug, /atleta/perfil): the radar plotted "Cardio 0" and
 * "Core 0" while Helen, Karen and Fran were on file. A category with no
 * movements on file has no score, and that is now true all the way down:
 * `buildCapabilityBuckets` returns `null`, `getMyCapabilityProfile` passes it
 * through, and `CapabilityRadar` keeps those categories off the polygon and
 * labels their breakdown row "sin datos".
 *
 * So every category is handed to the chart — the nulls no longer have to be
 * filtered out here to protect a `score: number` contract. The whole card is
 * still skipped when NOTHING has data.
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
              categories={capability.categories.map((c) => ({
                category: c.category,
                name: c.name,
                score: c.score,
                rawValue: c.rawValue,
                movementCount: c.movementCount,
              }))}
              overallRank={capability.overallRank}
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
                Registra un WOD de {withoutData.map((c) => c.name).join(", ")}{" "}
                para medir esas categorías.
              </p>
            )}
          </div>
        </KCard>
      </AnimatedItem>
    </AnimatedSection>
  );
}
