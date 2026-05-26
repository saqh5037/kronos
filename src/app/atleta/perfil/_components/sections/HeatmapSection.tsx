/**
 * HeatmapSection — attendance heatmap for the last 90 days.
 * Optional: try/catch → null.
 */

import { getMyAttendanceLast90d } from "@/server/actions/athlete-home";
import KCard from "@/components/kronos/KCard";
import { MyHeatmap90d } from "../MyHeatmap90d";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";

export async function HeatmapSection() {
  let attendance90d = [];
  try {
    attendance90d = await getMyAttendanceLast90d();
  } catch {
    return null;
  }

  if (attendance90d.length === 0) return null;

  return (
    <AnimatedSection className="mt-5 px-3.5">
      <AnimatedItem>
        <KCard>
          <div className="p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <p className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
                ASISTENCIA · ÚLTIMOS 90 DÍAS
              </p>
              <span
                className="font-mono text-[10px] font-bold"
                style={{ color: "var(--k-t2)" }}
              >
                {attendance90d.length} clases
              </span>
            </div>
            <MyHeatmap90d days={attendance90d} />
          </div>
        </KCard>
      </AnimatedItem>
    </AnimatedSection>
  );
}
