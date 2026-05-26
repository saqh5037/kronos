/**
 * RecentActivitySection — streams last score card + latest PR card.
 *
 * Uses getAthleteHomeCached() for the last score (deduped with other sections)
 * and listMyPRs() independently since no other section needs PR data.
 *
 * Both cards are conditional: if home has no lastScore, or prs is empty,
 * the respective card simply doesn't render — same behavior as before.
 */

import Link from "next/link";
import { getAthleteHomeCached } from "../request-cache";
import { listMyPRs } from "@/server/actions/prs";
import KCard from "@/components/kronos/KCard";
import RevealOnScroll from "@/components/kronos/RevealOnScroll";
import { formatScore } from "@/lib/scores";
import { formatDayMonth } from "@/lib/week";
import type { ScoreType } from "@/lib/validations/wod";

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
              <div
                className="w-[42px] h-[42px] rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(255, 90, 90, 0.1)",
                  border: "1px solid rgba(255, 90, 90, 0.3)",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--k-warning)"
                  strokeWidth="2"
                >
                  <path d="M6 9V5h12v4M5 9h14v4H5zM7 13l1 8h8l1-8" />
                </svg>
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
                className="text-lg opacity-40 hover:opacity-70 transition-opacity"
              >
                ›
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
              <div
                className="w-[42px] h-[42px] rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(255, 90, 90, 0.1)",
                  border: "1px solid rgba(255, 90, 90, 0.3)",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--k-warning)"
                  strokeWidth="2"
                >
                  <path d="M6 9V5h12v4M5 9h14v4H5zM7 13l1 8h8l1-8" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold">
                    {latestPR.movementName}
                  </span>
                  <span
                    className="k-chip k-chip-ember"
                    style={{ padding: "2px 6px", fontSize: 9 }}
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
                className="text-lg opacity-40 hover:opacity-70 transition-opacity"
              >
                ›
              </Link>
            </div>
          </KCard>
        </RevealOnScroll>
      )}
    </>
  );
}
