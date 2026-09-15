/**
 * HeatmapSection — attendance heatmap for the last 90 days.
 *
 * Audit 2026-09-15 (P1): the heatmap lit ~4 cells while the streak hero showed
 * 7 days and the card header counted 17 classes. Two different bugs, both now
 * fixed upstream of this file:
 *
 *   PREDICATE — `getMyAttendanceLast90d` required `checkedInAt != null` and
 *   dated by it, while the streak used `status: ATTENDED` dated by
 *   `class.startsAt`. A booking a coach marks attended from the roster has no
 *   `checkedInAt`, so it counted for the streak and was invisible here. Both
 *   paths now go through `attendanceDayOf` (src/lib/streak.ts), so this card
 *   shows ASISTENCIAS — the same events the streak counts.
 *
 *   TIMEZONE — bucketing happened on the client in the viewer's local time.
 *   It now happens on the server in the box timezone.
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
  let attendance;
  try {
    attendance = await getMyAttendanceLast90d();
  } catch {
    return null;
  }

  if (attendance.buckets.length === 0) return null;

  const totalDays = attendance.buckets.length;

  return (
    <AnimatedSection className="mt-5 px-3.5">
      <AnimatedItem>
        <KCard>
          <div className="p-4">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <p className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
                ASISTENCIAS · ÚLTIMOS 90 DÍAS
              </p>
              <span
                className="font-mono text-[10px] font-bold"
                style={{ color: "var(--k-t2)" }}
              >
                {totalDays}
              </span>
            </div>
            <MyHeatmap90d
              buckets={attendance.buckets}
              fromKey={attendance.fromKey}
              toKey={attendance.toKey}
            />
            <p
              className="mt-3 text-[11px]"
              style={{
                color: "var(--k-t3)",
                fontFamily: "var(--k-font-body)",
                lineHeight: 1.5,
              }}
            >
              Un cuadro por día que entrenaste, en el horario de tu box. Cuenta
              las mismas clases que tu racha.
            </p>
          </div>
        </KCard>
      </AnimatedItem>
    </AnimatedSection>
  );
}
