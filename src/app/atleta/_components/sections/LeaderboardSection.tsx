/**
 * LeaderboardSection — today's WOD board (top 4) plus the athlete's own row.
 *
 * Audit 2026-09-15 (S10): "MURPH HOY" listed 11:48, 9:04, 4:04, 9:00 as 1–4.
 * The section rendered `scores.slice(0, 4)` straight off `listScoresForWOD`,
 * which orders by `createdAt desc`. Ranking now comes pre-sorted by metric
 * direction from `getTodayWODWithScores`, and the athlete's own row is pinned
 * as "Tu posición" when it falls outside the visible four.
 *
 * Only renders if there's a WOD today AND it has scores. Otherwise returns null.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTodayWODWithScoresCached } from "../request-cache";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import RevealOnScroll from "@/components/kronos/RevealOnScroll";
import { formatScore } from "@/lib/scores";
import { scalingLabel } from "@/lib/labels";
import type { Scaling } from "@prisma/client";
import type { BoardRow } from "@/lib/scores/leaderboard";
import type { ScoreType } from "@/lib/validations/wod";

function Row({
  entry,
  scoreType,
  withBorder,
  pinned = false,
}: {
  entry: BoardRow;
  scoreType: ScoreType;
  withBorder: boolean;
  pinned?: boolean;
}) {
  const isTop3 = entry.rank <= 3;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderBottom: withBorder ? "1px solid var(--k-line)" : "none",
        borderTop: pinned ? "1px solid var(--k-accent-line)" : undefined,
        background: entry.isMe ? "var(--k-accent-soft)" : undefined,
      }}
    >
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 18,
          fontWeight: 700,
          width: 22,
          textAlign: "center",
          color: entry.isMe
            ? "var(--k-accent)"
            : isTop3
              ? "var(--k-t2)"
              : "var(--k-t3)",
        }}
      >
        {entry.rank}
      </div>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          fontWeight: 700,
          background: "var(--k-elevated)",
          border: `1px solid ${entry.isMe ? "var(--k-accent-line)" : "var(--k-line)"}`,
          color: entry.isMe ? "var(--k-accent)" : "var(--k-t2)",
        }}
      >
        {entry.athleteName.charAt(0)}
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 13,
          fontFamily: "var(--k-font-body)",
          fontWeight: entry.isMe ? 600 : 500,
          color: "var(--k-t1)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entry.isMe ? "Tu posición" : entry.athleteName}
      </div>
      <span
        style={{
          padding: "3px 8px",
          borderRadius: 999,
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.1em",
          background: "var(--k-elevated)",
          color: "var(--k-t2)",
          border: "1px solid var(--k-line)",
          flexShrink: 0,
        }}
      >
        {scalingLabel[entry.scaling as Scaling] ?? entry.scaling}
      </span>
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 14,
          fontWeight: 700,
          minWidth: 54,
          textAlign: "right",
          color: "var(--k-t1)",
        }}
      >
        {formatScore(entry.value, scoreType)}
      </div>
    </div>
  );
}

export async function LeaderboardSection() {
  let today: Awaited<ReturnType<typeof getTodayWODWithScoresCached>>;
  try {
    today = await getTodayWODWithScoresCached();
  } catch {
    // Optional section — skip on failure rather than blanking the page.
    return null;
  }

  const { wod, board } = today;
  if (!wod || board.entries.length === 0) return null;

  const scoreType = wod.scoreType as ScoreType;

  return (
    <RevealOnScroll variant="fade-up" className="mt-5">
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          padding: "0 18px 8px",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.18em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
          }}
        >
          Ranking · {wod.wodName.toUpperCase()} HOY
        </span>
        <Link
          href="/atleta/leaderboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: "var(--k-t2)",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          VER TODOS
          <ArrowRight width={12} height={12} aria-hidden />
        </Link>
      </div>
      <div className="px-3.5">
        <div
          style={{
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <AnimatedSection>
            {board.entries.map((entry, i, arr) => (
              <AnimatedItem key={entry.athleteId}>
                <Row
                  entry={entry}
                  scoreType={scoreType}
                  withBorder={i < arr.length - 1 || board.myEntry !== null}
                />
              </AnimatedItem>
            ))}
          </AnimatedSection>
          {board.myEntry && (
            <Row
              entry={board.myEntry}
              scoreType={scoreType}
              withBorder={false}
              pinned
            />
          )}
        </div>
        {board.myRank !== null && board.totalAthletes > 0 && (
          <p
            style={{
              margin: "8px 4px 0",
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--k-t3)",
            }}
          >
            Vas #{board.myRank} de {board.totalAthletes}
          </p>
        )}
      </div>
    </RevealOnScroll>
  );
}
