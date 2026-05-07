"use client";

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
import type { ScoreType } from "@/lib/validations/wod";

type Tab = "wod" | "movement" | "attendance";

type WODOption = { id: string; name: string; scoreType: ScoreType };
type MovementOption = { id: string; name: string };

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
};

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
  initialAttendanceData: AttendanceLeader[];
}) {
  const [tab, setTab] = useState<Tab>("wod");
  const [wodId, setWodId] = useState(initialWODId);
  const [movementId, setMovementId] = useState(initialMovementId);
  const [wodData, setWodData] = useState(initialWODData);
  const [movementData, setMovementData] = useState(initialMovementData);
  const [attendanceData] = useState(initialAttendanceData);
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
    <div className="pb-28 relative">
      {/* HERO V3 — limpio */}
      <header
        style={{
          padding: "56px 20px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
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
          LEADERBOARDS · ATLETA
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
          Tabla de rankings
        </h1>
      </header>

      {/* Tabs */}
      <AnimatedSection className="px-3.5">
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
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontFamily: "var(--k-font-display)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  transition: "all 150ms ease",
                  background: tab === t.key ? "var(--k-accent)" : "transparent",
                  color: tab === t.key ? "var(--k-accent-on)" : "var(--k-t2)",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: tab === t.key ? "var(--k-accent-glow)" : "none",
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
        <div className="px-3.5 mt-3">
          {tab === "wod" && (
            <select
              value={wodId}
              onChange={(e) => {
                setWodId(e.target.value);
                loadWOD(e.target.value);
              }}
              style={v3SelectStyle}
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
            <div className="text-sm" style={{ color: "var(--text-3)" }}>
              Cargando...
            </div>
          </KCard>
        </div>
      )}

      {/* WOD Ranking */}
      {!isPending && tab === "wod" && wodData && (
        <div className="px-3.5 mt-3">
          <KCard className="overflow-hidden">
            <AnimatedSection key={`wod-${wodId}`}>
              {wodData.entries.map((e, i, arr) => (
                <AnimatedItem key={e.athleteId}>
                  <LeaderboardRow
                    rank={i + 1}
                    entry={e}
                    scoreType={wodData.scoreType}
                    isLast={i === arr.length - 1}
                  />
                </AnimatedItem>
              ))}
            </AnimatedSection>
            {wodData.entries.length === 0 && (
              <div
                className="p-6 text-center text-sm"
                style={{ color: "var(--text-3)" }}
              >
                Sin scores registrados para este WOD.
              </div>
            )}
          </KCard>
        </div>
      )}

      {/* Movement Ranking */}
      {!isPending && tab === "movement" && movementData && (
        <div className="px-3.5 mt-3">
          <KCard className="overflow-hidden">
            <AnimatedSection key={`mov-${movementId}`}>
              {movementData.entries.map((e, i, arr) => (
                <AnimatedItem key={e.athleteId}>
                  <LeaderboardRow
                    rank={i + 1}
                    entry={e}
                    scoreType="WEIGHT"
                    isLast={i === arr.length - 1}
                  />
                </AnimatedItem>
              ))}
            </AnimatedSection>
            {movementData.entries.length === 0 && (
              <div
                className="p-6 text-center text-sm"
                style={{ color: "var(--text-3)" }}
              >
                Sin PRs registrados para este movimiento.
              </div>
            )}
          </KCard>
        </div>
      )}

      {/* Attendance Ranking */}
      {!isPending && tab === "attendance" && (
        <div className="px-3.5 mt-3">
          <KCard className="overflow-hidden">
            <AnimatedSection>
              {attendanceData.map((e, i, arr) => (
                <AnimatedItem key={e.athleteId}>
                  <AttendanceRow
                    rank={i + 1}
                    entry={e}
                    isLast={i === arr.length - 1}
                  />
                </AnimatedItem>
              ))}
            </AnimatedSection>
            {attendanceData.length === 0 && (
              <div
                className="p-6 text-center text-sm"
                style={{ color: "var(--text-3)" }}
              >
                Sin datos de asistencia esta semana.
              </div>
            )}
          </KCard>
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({
  rank,
  entry,
  scoreType,
  isLast,
}: {
  rank: number;
  entry: LeaderboardEntry;
  scoreType: ScoreType;
  isLast: boolean;
}) {
  const isTop3 = rank <= 3;
  const isFirst = rank === 1;
  const rankColor = isTop3 ? "var(--k-accent)" : "var(--k-t3)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderBottom: isLast ? "none" : "1px solid var(--k-line)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 18,
          fontWeight: 700,
          width: 20,
          textAlign: "center",
          color: rankColor,
          textShadow: isFirst ? "var(--k-accent-glow)" : "none",
        }}
      >
        {rank}
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
          background: isTop3 ? "var(--k-accent-soft)" : "var(--k-elevated)",
          border: `1px solid ${isTop3 ? "var(--k-accent-line)" : "var(--k-line)"}`,
          color: isTop3 ? "var(--k-accent)" : "var(--k-t3)",
        }}
      >
        {entry.athleteName[0]}
      </div>
      <div
        style={{
          flex: 1,
          fontSize: 13,
          fontFamily: "var(--k-font-body)",
          fontWeight: 500,
          color: "var(--k-t1)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entry.athleteName}
      </div>
      <span
        style={{
          flexShrink: 0,
          padding: "3px 8px",
          borderRadius: 999,
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.1em",
          background:
            entry.scaling === "RX"
              ? "var(--k-accent-soft)"
              : "var(--k-elevated)",
          color: entry.scaling === "RX" ? "var(--k-accent)" : "var(--k-t3)",
          border: `1px solid ${entry.scaling === "RX" ? "var(--k-accent-line)" : "var(--k-line)"}`,
        }}
      >
        {entry.scaling}
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

function AttendanceRow({
  rank,
  entry,
  isLast,
}: {
  rank: number;
  entry: AttendanceLeader;
  isLast: boolean;
}) {
  const isTop3 = rank <= 3;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderBottom: isLast ? "none" : "1px solid var(--k-line)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 18,
          fontWeight: 700,
          width: 20,
          textAlign: "center",
          color: isTop3 ? "var(--k-accent)" : "var(--k-t3)",
        }}
      >
        {rank}
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
          background: isTop3 ? "var(--k-accent-soft)" : "var(--k-elevated)",
          border: `1px solid ${isTop3 ? "var(--k-accent-line)" : "var(--k-line)"}`,
          color: isTop3 ? "var(--k-accent)" : "var(--k-t3)",
        }}
      >
        {entry.athleteName[0]}
      </div>
      <div
        style={{
          flex: 1,
          fontSize: 13,
          fontFamily: "var(--k-font-body)",
          fontWeight: 500,
          color: "var(--k-t1)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entry.athleteName}
      </div>
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
        {entry.attendedCount}
      </div>
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "var(--k-t3)",
          textTransform: "uppercase",
        }}
      >
        clases
      </div>
    </div>
  );
}
