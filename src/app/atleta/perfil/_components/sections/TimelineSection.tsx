/**
 * TimelineSection — scores progress timeline over the last 90 days.
 * Optional: try/catch → null.
 */

import { getMyScoresTimeline } from "@/server/actions/athlete-home";
import KCard from "@/components/kronos/KCard";
import { ScoresTimeline } from "../ScoresTimeline";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";

export async function TimelineSection() {
  let scoresTimeline = [];
  try {
    scoresTimeline = await getMyScoresTimeline(90);
  } catch {
    return null;
  }

  if (scoresTimeline.length < 2) return null;

  return (
    <AnimatedSection className="mt-5 px-3.5">
      <AnimatedItem>
        <KCard>
          <div className="p-4">
            <p className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
              PROGRESO · ÚLTIMOS 90 DÍAS
            </p>
            <ScoresTimeline data={scoresTimeline} />
            <p className="mt-2 text-[10px]" style={{ color: "var(--k-t3)" }}>
              Valores normalizados 0–100 para comparar entre WODs.
            </p>
          </div>
        </KCard>
      </AnimatedItem>
    </AnimatedSection>
  );
}
