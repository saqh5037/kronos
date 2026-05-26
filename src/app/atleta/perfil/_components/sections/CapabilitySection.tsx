/**
 * CapabilitySection — capability radar chart.
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

  if (!capability || capability.categories.length === 0) return null;

  return (
    <AnimatedSection className="mt-5 px-3.5">
      <AnimatedItem>
        <KCard>
          <div className="p-4">
            <p className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
              PERFIL DE CAPACIDADES
            </p>
            <CapabilityRadar
              categories={capability.categories}
              overallRank={capability.overallRank}
              totalAthletes={capability.totalAthletes}
              weakestCategory={capability.weakestCategory}
              strongestCategory={capability.strongestCategory}
              height={240}
            />
          </div>
        </KCard>
      </AnimatedItem>
    </AnimatedSection>
  );
}
