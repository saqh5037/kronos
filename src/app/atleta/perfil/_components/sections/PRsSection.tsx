/**
 * PRsSection — personal records grid.
 * Uses listMyPRs() directly (only consumer in this page).
 */

import { listMyPRs } from "@/server/actions/prs";
import { formatDayMonth } from "@/lib/week";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import KCard from "@/components/kronos/KCard";

export async function PRsSection() {
  let prs = [];
  try {
    prs = await listMyPRs();
  } catch {
    return null;
  }

  if (prs.length === 0) return null;

  return (
    <AnimatedSection className="mt-2">
      <div className="flex items-baseline justify-between px-[18px] pb-2">
        <div className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
          RECORDS PERSONALES
        </div>
        <div
          className="font-mono text-[10px] font-bold tracking-[0.08em]"
          style={{ color: "var(--k-t3)" }}
        >
          TOP {Math.min(prs.length, 6)} DE {prs.length}
        </div>
      </div>
      <div className="px-3.5 grid grid-cols-2 gap-2">
        {prs.slice(0, 6).map((pr, i) => (
          <AnimatedItem key={pr.id}>
            <KCard>
              <div className="p-3 relative">
                <div
                  className="text-[11px] font-semibold mb-1.5 truncate"
                  style={{ color: "var(--k-t2)" }}
                >
                  {pr.movementName}
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span
                    className="font-display font-bold text-2xl"
                    style={{
                      letterSpacing: "-0.02em",
                      color: i === 0 ? "var(--k-t2)" : "var(--text)",
                      textShadow:
                        i === 0 ? "0 0 10px rgba(25,240,139,0.3)" : "none",
                    }}
                  >
                    {pr.value}
                  </span>
                  <span
                    className="font-mono text-[11px] font-bold"
                    style={{ color: "var(--k-t3)" }}
                  >
                    {pr.unit}
                  </span>
                </div>
                <div
                  className="font-mono text-[9px] font-bold tracking-[0.06em]"
                  style={{ color: "var(--k-t3)" }}
                >
                  {formatDayMonth(pr.achievedAt).toUpperCase()}
                </div>
              </div>
            </KCard>
          </AnimatedItem>
        ))}
      </div>
    </AnimatedSection>
  );
}
