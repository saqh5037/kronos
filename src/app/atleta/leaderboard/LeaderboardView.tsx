"use client";

/**
 * LeaderboardView — box rankings for the athlete.
 *
 * Audit 2026-09-15 (P1/P2, /atleta/leaderboard):
 *  - "six strangers, no me": there was no pinned "Tu posición" row. Every board
 *    now renders the athlete's own row, highlighted when it is inside the top
 *    and pinned underneath when it is not.
 *  - "three names for one thing (title 'Tabla de rankings', eyebrow
 *    'LEADERBOARDS', profile tile 'Ranking')" → one name: Ranking.
 *  - The 1RM board that topped at 111 kg while the athlete's profile said
 *    "#1 de 36" now reads the union of scores and the PR ledger; a row sourced
 *    from the PR ledger is labelled "PR" so the number is traceable.
 *  - Scaling chips printed the raw enum → `scalingLabel`.
 */

import { useState, useTransition } from "react";
import {
  getWODLeaderboard,
  getMovementLeaderboard,
  type LeaderboardEntry,
  type AttendanceLeader,
} from "@/server/actions/leaderboards";
import KCard from "@/components/kronos/KCard";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import { formatScore } from "@/lib/scores";
import { scalingLabel } from "@/lib/labels";
import type { Scaling } from "@prisma/client";
import type { ScoreType } from "@/lib/validations/wod";
import { TourTriggerButton } from "@/components/tour/TourTriggerButton";
import { leaderboardTour } from "@/components/tour/tours/leaderboard";

type Tab = "wod" | "movement" | "attendance";

type WODOption = { id: string; name: string; scoreType: ScoreType };
type MovementOption = { id: string; name: string };

type AttendanceBoard = {
  entries: AttendanceLeader[];
  myEntry: AttendanceLeader | null;
  myRank: number | null;
  totalAthletes: number;
};

const v3SelectStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--k-elevated)",
  color: "var(--k-t1)",
  border: "1px solid var(--k-line)",
  borderRadius: 12,
  padding: "10px 36px 10px 14px",
  fontFamily: "var(--k-font-body)",
  fontSize: 13,
  fontWeight: 500,
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a8a94' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  cursor: "pointer",
  minHeight: 44,
};

function EmptyBoard({ message }: { message: string }) {
  return (
    <div className="p-6 text-center text-sm" style={{ color: "var(--k-t3)" }}>
      {message}
    </div>
  );
}

function MyPositionNote({
  myRank,
  total,
}: {
  myRank: number | null;
  total: number;
}) {
  if (myRank === null || total === 0) return null;
  return (
    <p
      className="px-1 mt-2"
      style={{
        fontFamily: "var(--k-font-display)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--k-t3)",
      }}
    >
      Tu posición: #{myRank} de {total}
    </p>
  );
}

export default function LeaderboardPage({
  wodOptions,
  movementOptions,
  initialWODId,
  initialMovementId,
  initialWODData,
  initialMovementData,
  initialAttendanceData,
}: {
  wodOptions: WODOption[];
  movementOptions: MovementOption[];
  initialWODId: string;
  initialMovementId: string;
  initialWODData: Awaited<ReturnType<typeof getWODLeaderboard>> | null;
  initialMovementData: Awaited<
    ReturnType<typeof getMovementLeaderboard>
  > | null;
  initialAttendanceData: AttendanceBoard;
}) {
  const [tab, setTab] = useState<Tab>("wod");
  const [wodId, setWodId] = useState(initialWODId);
  const [movementId, setMovementId] = useState(initialMovementId);
  const [wodData, setWodData] = useState(initialWODData);
  const [movementData, setMovementData] = useState(initialMovementData);
  const [attendance] = useState(initialAttendanceData);
  const [isPending, startTransition] = useTransition();

  async function loadWOD(id: string) {
    startTransition(async () => {
      try {
        const data = await getWODLeaderboard(id);
        setWodData(data);
      } catch {
        setWodData(null);
      }
    });
  }

  async function loadMovement(id: string) {
    startTransition(async () => {
      try {
        const data = await getMovementLeaderboard(id);
        setMovementData(data);
      } catch {
        setMovementData(null);
      }
    });
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "wod", label: "WOD" },
    { key: "movement", label: "Movimiento" },
    { key: "attendance", label: "Asistencia" },
  ];

  return (
    <div className="pb-28 relative" style={{ overflowX: "hidden" }}>
      {/* HERO V3 — limpio */}
      <header
        data-tour="leaderboard.header"
        style={{
          padding: "20px 20px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 20, right: 20 }}>
          <TourTriggerButton tourId={leaderboardTour.id} />
        </div>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
          }}
        >
          RANKING · TU BOX
        </span>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--k-t1)",
            margin: 0,
            lineHeight: 1.05,
          }}
        >
          Ranking
        </h1>
      </header>

      {/* Tabs */}
      <AnimatedSection data-tour="leaderboard.tabs" className="px-3.5">
        <AnimatedItem>
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: 4,
              borderRadius: 12,
              background: "var(--k-elevated)",
              border: "1px solid var(--k-line)",
            }}
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1,
                  minHeight: 40,
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontFamily: "var(--k-font-display)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  background: tab === t.key ? "var(--k-t1)" : "transparent",
                  color: tab === t.key ? "var(--k-bg)" : "var(--k-t2)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </AnimatedItem>
      </AnimatedSection>

      {/* Filters */}
      {(tab === "wod" || tab === "movement") && (
        <div data-tour="leaderboard.filters" className="px-3.5 mt-3">
          {tab === "wod" && (
            <select
              value={wodId}
              onChange={(e) => {
                setWodId(e.target.value);
                loadWOD(e.target.value);
              }}
              style={v3SelectStyle}
              aria-label="Elegir WOD"
            >
              {wodOptions.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
          {tab === "movement" && (
            <select
              value={movementId}
              onChange={(e) => {
                setMovementId(e.target.value);
                loadMovement(e.target.value);
              }}
              style={v3SelectStyle}
              aria-label="Elegir movimiento"
            >
              {movementOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Loading */}
      {isPending && (
        <div className="px-3.5 mt-4">
          <KCard variant="ghost" className="p-6 text-center">
            <div className="text-sm" style={{ color: "var(--k-t3)" }}>
              Cargando…
            </div>
          </KCard>
        </div>
      )}

      {/* WOD Ranking */}
      {!isPending && tab === "wod" && wodData && (
        <div data-tour="leaderboard.ranking" className="px-3.5 mt-3">
          <KCard className="overflow-hidden">
            <AnimatedSection key={`wod-${wodId}`}>
              {wodData.entries.map((e, i, arr) => (
                <AnimatedItem key={`${e.athleteId}-${e.source}`}>
                  <LeaderboardRow
                    entry={e}
                    scoreType={wodData.scoreType}
                    isLast={i === arr.length - 1 && !wodData.myEntry}
                  />
                </AnimatedItem>
              ))}
            </AnimatedSection>
            {wodData.myEntry && (
              <LeaderboardRow
                entry={wodData.myEntry}
                scoreType={wodData.scoreType}
                isLast
                pinned
              />
            )}
            {wodData.entries.length === 0 && (
              <EmptyBoard message="Sin resultados registrados para este WOD." />
            )}
          </KCard>
          <MyPositionNote
            myRank={wodData.myRank}
            total={wodData.totalAthletes}
          />
        </div>
      )}

      {/* Movement Ranking */}
      {!isPending && tab === "movement" && movementData && (
        <div data-tour="leaderboard.ranking" className="px-3.5 mt-3">
          <KCard className="overflow-hidden">
            <AnimatedSection key={`mov-${movementId}`}>
              {movementData.entries.map((e, i, arr) => (
                <AnimatedItem key={e.athleteId}>
                  <LeaderboardRow
                    entry={e}
                    scoreType="WEIGHT"
                    isLast={i === arr.length - 1 && !movementData.myEntry}
                  />
                </AnimatedItem>
              ))}
            </AnimatedSection>
            {movementData.myEntry && (
              <LeaderboardRow
                entry={movementData.myEntry}
                scoreType="WEIGHT"
                isLast
                pinned
              />
            )}
            {movementData.entries.length === 0 && (
              <EmptyBoard message="Sin PRs registrados para este movimiento." />
            )}
          </KCard>
          <MyPositionNote
            myRank={movementData.myRank}
            total={movementData.totalAthletes}
          />
        </div>
      )}

      {/* Attendance Ranking */}
      {!isPending && tab === "attendance" && (
        <div data-tour="leaderboard.ranking" className="px-3.5 mt-3">
          <KCard className="overflow-hidden">
            <AnimatedSection>
              {attendance.entries.map((e, i, arr) => (
                <AnimatedItem key={e.athleteId}>
                  <AttendanceRow
                    entry={e}
                    isLast={i === arr.length - 1 && !attendance.myEntry}
                  />
                </AnimatedItem>
              ))}
            </AnimatedSection>
            {attendance.myEntry && (
              <AttendanceRow entry={attendance.myEntry} isLast pinned />
            )}
            {attendance.entries.length === 0 && (
              <EmptyBoard message="Sin datos de asistencia esta semana." />
            )}
          </KCard>
          <MyPositionNote
            myRank={attendance.myRank}
            total={attendance.totalAthletes}
          />
        </div>
      )}
    </div>
  );
}

const rowStyle = (
  isLast: boolean,
  pinned: boolean,
  isMe: boolean,
): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "12px",
  minHeight: 52,
  borderBottom: isLast ? "none" : "1px solid var(--k-line)",
  borderTop: pinned ? "1px solid var(--k-accent-line)" : undefined,
  background: isMe ? "var(--k-accent-soft)" : undefined,
  minWidth: 0,
  overflow: "hidden",
});

function RankCell({ rank, isMe }: { rank: number; isMe: boolean }) {
  return (
    <div
      style={{
        fontFamily: "var(--k-font-display)",
        fontSize: 16,
        fontWeight: 700,
        width: 22,
        flexShrink: 0,
        textAlign: "center",
        color: isMe
          ? "var(--k-accent)"
          : rank <= 3
            ? "var(--k-t2)"
            : "var(--k-t3)",
      }}
    >
      {rank}
    </div>
  );
}

function AvatarCell({ name, isMe }: { name: string; isMe: boolean }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        flexShrink: 0,
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--k-font-display)",
        fontSize: 10,
        fontWeight: 700,
        background: "var(--k-elevated)",
        border: `1px solid ${isMe ? "var(--k-accent-line)" : "var(--k-line)"}`,
        color: isMe ? "var(--k-accent)" : "var(--k-t2)",
      }}
    >
      {name.charAt(0)}
    </div>
  );
}

function NameCell({ name, isMe }: { name: string; isMe: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        fontSize: 13,
        fontFamily: "var(--k-font-body)",
        fontWeight: isMe ? 600 : 500,
        color: "var(--k-t1)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {isMe ? "Tu posición" : name}
    </div>
  );
}

function LeaderboardRow({
  entry,
  scoreType,
  isLast,
  pinned = false,
}: {
  entry: LeaderboardEntry;
  scoreType: ScoreType;
  isLast: boolean;
  pinned?: boolean;
}) {
  return (
    <div style={rowStyle(isLast, pinned, entry.isMe)}>
      <RankCell rank={entry.rank} isMe={entry.isMe} />
      <AvatarCell name={entry.athleteName} isMe={entry.isMe} />
      <NameCell name={entry.athleteName} isMe={entry.isMe} />
      <span
        title={
          entry.source === "pr"
            ? "Marca del registro de PRs, no de un score de este WOD"
            : undefined
        }
        style={{
          flexShrink: 0,
          padding: "3px 6px",
          borderRadius: 999,
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.1em",
          background: "var(--k-elevated)",
          color: "var(--k-t2)",
          border: "1px solid var(--k-line)",
          whiteSpace: "nowrap",
        }}
      >
        {entry.source === "pr"
          ? "PR"
          : (scalingLabel[entry.scaling as Scaling] ?? entry.scaling)}
      </span>
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0,
          textAlign: "right",
          color: "var(--k-t1)",
        }}
      >
        {formatScore(entry.value, scoreType)}
      </div>
    </div>
  );
}

function AttendanceRow({
  entry,
  isLast,
  pinned = false,
}: {
  entry: AttendanceLeader;
  isLast: boolean;
  pinned?: boolean;
}) {
  return (
    <div style={rowStyle(isLast, pinned, entry.isMe)}>
      <RankCell rank={entry.rank} isMe={entry.isMe} />
      <AvatarCell name={entry.athleteName} isMe={entry.isMe} />
      <NameCell name={entry.athleteName} isMe={entry.isMe} />
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0,
          textAlign: "right",
          color: "var(--k-t1)",
        }}
      >
        {entry.attendedCount}
      </div>
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          fontWeight: 700,
          flexShrink: 0,
          letterSpacing: "0.1em",
          color: "var(--k-t3)",
          textTransform: "uppercase",
        }}
      >
        {entry.attendedCount === 1 ? "clase" : "clases"}
      </div>
    </div>
  );
}
