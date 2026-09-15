/**
 * HeatmapSection — attendance heatmap for the last 90 days.
 *
 * KNOWN DIVERGENCE (audit 2026-09-15, P1 bug): the heatmap lights ~4 cells
 * while the streak hero shows 7 days and the card header counts 17 classes.
 * The two numbers come from different predicates on the same table:
 *
 *   streak / weekAttendance  →  Booking.status = ATTENDED, dated by class.startsAt
 *   this heatmap             →  Booking.status = ATTENDED AND checkedInAt != null,
 *                               dated by checkedInAt
 *
 * A booking a coach marks attended from the roster has no `checkedInAt`, so it
 * counts for the streak and is invisible here. The fix is one predicate in
 * `getMyAttendanceLast90d` (src/server/actions/athlete-home.ts) — a file this
 * wave does not own, so it is reported rather than changed.
 *
 * Until then the card says what the data actually is ("check-ins"), so it no
 * longer reads as a contradiction of the streak.
 *
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
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <p className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
                CHECK-INS · ÚLTIMOS 90 DÍAS
              </p>
              <span
                className="font-mono text-[10px] font-bold"
                style={{ color: "var(--k-t2)" }}
              >
                {attendance90d.length}
              </span>
            </div>
            <MyHeatmap90d days={attendance90d} />
            <p
              className="mt-3 text-[11px]"
              style={{
                color: "var(--k-t3)",
                fontFamily: "var(--k-font-body)",
                lineHeight: 1.5,
              }}
            >
              Cuenta los días en que hiciste check-in en el box. Tu racha usa
              todas las clases marcadas como asistidas, así que puede ser mayor.
            </p>
          </div>
        </KCard>
      </AnimatedItem>
    </AnimatedSection>
  );
}
