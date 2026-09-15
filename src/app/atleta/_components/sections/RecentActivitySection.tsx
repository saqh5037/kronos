/**
 * RecentActivitySection — streams last score card + latest PR card.
 *
 * Audit 2026-09-15 (P1 colour, S2): both cards used an orange kettlebell icon
 * on a red-tinted tile and the PR chip was `k-chip-ember`. Nothing here is a
 * warning — a PR is the best thing that happens in the app. Both are lime now,
 * and the decorative unicode "›" affordance is a lucide `ChevronRight`.
 *
 * Uses getAthleteHomeCached() for the last score (deduped with other sections)
 * and listMyPRs() independently since no other section needs PR data.
 *
 * Both cards are conditional: if home has no lastScore, or prs is empty,
 * the respective card simply doesn't render — same behavior as before.
 */

import Link from "next/link";
import { ChevronRight, Dumbbell, Trophy } from "lucide-react";
import { getAthleteHomeCached } from "../request-cache";
import { listMyPRs } from "@/server/actions/prs";
import KCard from "@/components/kronos/KCard";
import RevealOnScroll from "@/components/kronos/RevealOnScroll";
import { formatScore } from "@/lib/scores";
import { formatDayMonth } from "@/lib/week";
import type { ScoreType } from "@/lib/validations/wod";

/** Lime tile, same treatment for both cards — brand, not warning. */
const ICON_TILE: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--k-accent-soft)",
  border: "1px solid var(--k-accent-line)",
  color: "var(--k-accent)",
  flexShrink: 0,
};

export async function RecentActivitySection() {
  const [home, prs] = await Promise.all([getAthleteHomeCached(), listMyPRs()]);

  if (!home) return null;

  const latestPR = prs[0] ?? null;

  return (
    <>
      {/* LAST SCORE */}
      {home.lastScore && (
        <RevealOnScroll variant="fade-up" className="mt-4 px-3.5">
          <KCard>
            <div className="p-3.5 flex items-center gap-3.5">
              <div style={ICON_TILE}>
                <Dumbbell width={20} height={20} aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold">
                    {home.lastScore.wodName}
                  </span>
                </div>
                <div
                  className="font-mono text-[10px] tracking-[0.06em]"
                  style={{ color: "var(--k-t2)" }}
                >
                  {formatScore(
                    home.lastScore.value,
                    home.lastScore.scoreType as ScoreType,
                  )}{" "}
                  · {formatDayMonth(home.lastScore.createdAt).toUpperCase()}
                </div>
              </div>
              <Link
                href="/atleta/perfil"
                aria-label="Ver mi perfil"
                className="opacity-40 hover:opacity-70 transition-opacity"
                style={{ color: "var(--k-t2)" }}
              >
                <ChevronRight width={18} height={18} aria-hidden />
              </Link>
            </div>
          </KCard>
        </RevealOnScroll>
      )}

      {/* LATEST PR */}
      {latestPR && (
        <RevealOnScroll variant="fade-up" className="mt-4 px-3.5">
          <KCard>
            <div className="p-3.5 flex items-center gap-3.5">
              <div style={ICON_TILE}>
                <Trophy width={20} height={20} aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold">
                    {latestPR.movementName}
                  </span>
                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: 999,
                      fontFamily: "var(--k-font-display)",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      background: "var(--k-accent-soft)",
                      border: "1px solid var(--k-accent-line)",
                      color: "var(--k-accent)",
                    }}
                  >
                    PR
                  </span>
                </div>
                <div
                  className="font-mono text-[10px] tracking-[0.06em]"
                  style={{ color: "var(--k-t2)" }}
                >
                  {latestPR.value} {latestPR.unit} ·{" "}
                  {formatDayMonth(latestPR.achievedAt).toUpperCase()}
                </div>
              </div>
              <Link
                href="/atleta/perfil"
                aria-label="Ver mis PRs"
                className="opacity-40 hover:opacity-70 transition-opacity"
                style={{ color: "var(--k-t2)" }}
              >
                <ChevronRight width={18} height={18} aria-hidden />
              </Link>
            </div>
          </KCard>
        </RevealOnScroll>
      )}
    </>
  );
}
