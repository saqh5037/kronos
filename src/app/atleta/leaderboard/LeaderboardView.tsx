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
      <header className="relative px-4 pt-14 pb-5 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 0% 0%, rgba(230,0,38,0.06), transparent 60%), radial-gradient(ellipse at 100% 100%, rgba(0,191,255,0.06), transparent 60%)",
          }}
        />
        <span className="k-corner-tl" aria-hidden />
        <span className="k-corner-br" aria-hidden />
        <AnimatedSection className="relative">
          <AnimatedItem>
            <span className="k-eyebrow-bar">Leaderboards</span>
            <div className="mt-2 flex items-baseline gap-2 flex-wrap">
              <span
                className="font-script text-[26px] leading-none"
                style={{ color: "var(--red)" }}
              >
                Tabla de
              </span>
              <h1
                className="k-h-italic font-display font-extrabold text-[32px] leading-[1] tracking-[-0.02em]"
                style={{ color: "var(--text)" }}
              >
                <em>rankings</em>
              </h1>
            </div>
          </AnimatedItem>
        </AnimatedSection>
      </header>

      {/* Tabs */}
      <AnimatedSection className="px-3.5">
        <AnimatedItem>
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ background: "var(--bg-soft)" }}
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex-1 py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all"
                style={{
                  background: tab === t.key ? "var(--card)" : "transparent",
                  color: tab === t.key ? "var(--text)" : "var(--text-3)",
                  boxShadow: tab === t.key ? "var(--card-glow)" : "none",
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
              className="w-full k-card px-3 py-2.5 text-[13px] font-medium rounded-xl appearance-none"
              style={{
                background: "var(--card)",
                border: "1px solid var(--line)",
                color: "var(--text)",
              }}
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
              className="w-full k-card px-3 py-2.5 text-[13px] font-medium rounded-xl appearance-none"
              style={{
                background: "var(--card)",
                border: "1px solid var(--line)",
                color: "var(--text)",
              }}
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
  const rankGlows = [
    "0 0 14px rgba(25,240,139,0.45)",
    "0 0 10px rgba(58,163,255,0.35)",
    "0 0 8px rgba(255,94,94,0.30)",
  ];

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--line)",
      }}
    >
      <div
        className="font-display text-lg font-bold w-5 text-center"
        style={{
          color: isTop3 ? "var(--recovery)" : "var(--text-3)",
          textShadow: isTop3 ? rankGlows[rank - 1] : "none",
        }}
      >
        {rank}
      </div>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{
          background: isTop3
            ? `var(--${["moss", "steel", "ember"][rank - 1]}-soft)`
            : "var(--bg-soft)",
          border: `1px solid ${isTop3 ? `var(--${["moss", "steel", "ember"][rank - 1]}-line)` : "var(--line)"}`,
          color: isTop3
            ? `var(--${["moss", "steel", "ember"][rank - 1]})`
            : "var(--text-3)",
        }}
      >
        {entry.athleteName[0]}
      </div>
      <div className="flex-1 text-[13px] font-medium truncate">
        {entry.athleteName}
      </div>
      <span
        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
        style={{
          background:
            entry.scaling === "RX" ? "var(--moss-soft)" : "var(--bg-soft)",
          color: entry.scaling === "RX" ? "var(--moss)" : "var(--text-3)",
          border: `1px solid ${entry.scaling === "RX" ? "var(--moss-line)" : "var(--line)"}`,
        }}
      >
        {entry.scaling}
      </span>
      <div className="font-display text-sm font-bold min-w-[54px] text-right">
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
      className="flex items-center gap-3 px-4 py-3"
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--line)",
      }}
    >
      <div
        className="font-display text-lg font-bold w-5 text-center"
        style={{ color: isTop3 ? "var(--moss)" : "var(--text-3)" }}
      >
        {rank}
      </div>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{
          background: isTop3 ? "var(--moss-soft)" : "var(--bg-soft)",
          border: `1px solid ${isTop3 ? "var(--moss-line)" : "var(--line)"}`,
          color: isTop3 ? "var(--moss)" : "var(--text-3)",
        }}
      >
        {entry.athleteName[0]}
      </div>
      <div className="flex-1 text-[13px] font-medium truncate">
        {entry.athleteName}
      </div>
      <div className="font-display text-sm font-bold min-w-[54px] text-right">
        {entry.attendedCount}
      </div>
      <div className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>
        clases
      </div>
    </div>
  );
}
