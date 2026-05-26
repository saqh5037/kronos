/**
 * WodContentSection — streams the WOD detail + score history.
 *
 * getTodayWOD and listMyScores are called only here (one section each),
 * so no request-cache dedup needed — direct action calls are fine.
 */

import {
  getTodayWOD,
  listMyScores,
  type TodayWOD,
  type MyScoreRow,
} from "@/server/actions/scores";
import ScoreForm from "@/components/ScoreForm";
import { formatScore } from "@/lib/scores";
import { formatDayMonth } from "@/lib/week";
import type { ScoreType } from "@/lib/validations/wod";
import WodDetalleV3, {
  type WodDetalleV3Props,
  type MovementRowData,
} from "@/components/kronos/v3/WodDetalleV3";

function detectIcon(name: string): MovementRowData["iconKind"] {
  const n = name.toLowerCase();
  if (/(run|correr|sprint|row|remo|bike)/.test(n)) return "run";
  if (
    /(swing|kettlebell|kb|snatch|clean|jerk|barbell|deadlift|squat|press|c\&j)/.test(
      n,
    )
  )
    return "kb";
  if (/(pull|chin|toes|t2b|muscle|hand)/.test(n)) return "pull";
  return "default";
}

function roundsLabelFor(wod: NonNullable<TodayWOD>): {
  label: string;
  sub: string;
} {
  const t = wod.wodType?.toUpperCase?.() ?? "";
  if (t.includes("AMRAP")) {
    return {
      label: wod.timeCap ? `AMRAP ${wod.timeCap}` : "AMRAP",
      sub: "AS MANY ROUNDS AS POSSIBLE",
    };
  }
  if (t.includes("EMOM")) {
    return {
      label: wod.timeCap ? `EMOM ${wod.timeCap}` : "EMOM",
      sub: "EVERY MIN ON THE MIN",
    };
  }
  if (t.includes("RFT") || t.includes("FOR_TIME") || t.includes("FORTIME")) {
    return {
      label: t.includes("RFT") ? t : "FOR TIME",
      sub: "ROUNDS FOR TIME",
    };
  }
  return { label: t || wod.scoreType, sub: wod.scoreType };
}

export async function WodContentSection() {
  let wod: TodayWOD = null;
  let myScores: MyScoreRow[] = [];

  try {
    [wod, myScores] = await Promise.all([getTodayWOD(), listMyScores(20)]);
  } catch {
    // no session
  }

  if (!wod) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--k-bg)",
          color: "var(--k-t1)",
          padding: "32px 20px",
          fontFamily: "var(--k-font-body)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            letterSpacing: "0.2em",
            color: "var(--k-t3)",
            fontWeight: 600,
          }}
        >
          WOD · HOY
        </span>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            margin: 0,
            color: "var(--k-t1)",
          }}
        >
          Sin WOD
        </h1>
        <p style={{ color: "var(--k-t2)", fontSize: 13 }}>
          No hay WOD programado para hoy todavía.
        </p>
      </div>
    );
  }

  const wodScores = myScores.filter((s) => s.wodId === wod.wodId);
  const best = wodScores[0];
  const sparkValues = wodScores
    .slice(0, 5)
    .reverse()
    .map((s) => Number(s.value));
  const firstAttempt = wodScores[wodScores.length - 1];
  const delta =
    best && firstAttempt && wodScores.length >= 2
      ? best.scoreType === "TIME"
        ? `↓ desde ${formatScore(Number(firstAttempt.value), firstAttempt.scoreType as ScoreType)}`
        : `↑ desde ${formatScore(Number(firstAttempt.value), firstAttempt.scoreType as ScoreType)}`
      : undefined;

  const bestDateLabel = best
    ? `${formatDayMonth(best.createdAt)} · HACE ${Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(best.createdAt).getTime()) / 86400000,
        ),
      )} DÍAS`
    : undefined;

  const movements: MovementRowData[] = wod.movements.map((m) => {
    const reps = m.reps != null ? String(m.reps) : "—";
    const weightSub = m.weight ? `${m.weight} kg` : "";
    const noteSub = m.notes ? m.notes : "";
    const sub = [weightSub, noteSub].filter(Boolean).join(" · ");
    return {
      reps,
      name: m.name,
      sub: sub || undefined,
      iconKind: detectIcon(m.name),
      movementId: m.movementId,
    };
  });

  const rounds = roundsLabelFor(wod);

  const props: WodDetalleV3Props = {
    wodName: wod.wodName,
    wodType: wod.wodType,
    scoreType: wod.scoreType,
    timeCap: wod.timeCap,
    movements,
    roundsLabel: rounds.label,
    roundsSub: rounds.sub,
    bestScore: best
      ? formatScore(Number(best.value), best.scoreType as ScoreType)
      : undefined,
    bestScoreDateLabel: bestDateLabel,
    bestScoreSpark: sparkValues.length >= 2 ? sparkValues : undefined,
    bestScoreDelta: delta,
    leaderboardHref: {
      pathname: "/atleta/leaderboard",
    } as unknown as WodDetalleV3Props["leaderboardHref"],
    backHref: "/atleta",
    hidePrimaryCta: true,
    scoreFormSlot: (
      <ScoreForm
        wodId={wod.wodId}
        scoreType={wod.scoreType}
        classId={wod.classId}
      />
    ),
  };

  return <WodDetalleV3 {...props} />;
}
