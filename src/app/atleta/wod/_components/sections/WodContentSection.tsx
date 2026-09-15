/**
 * WodContentSection — streams the WOD detail + score history.
 *
 * Audit 2026-09-15 (P1, /atleta/wod) fixed here:
 *  - The chip read "FORTIME" and the meta line printed the raw `TIME` enum →
 *    both go through `wodTypeLabel` / `scoreTypeLabel`.
 *  - The movement card subtitle said "ROUNDS FOR TIME" on a For Time WOD →
 *    the subtitle now describes the SCORE type, which is what it measures.
 *  - The free-text description contradicted the structured movement list
 *    ("1 mile run …" vs "3200 Run") → the description renders only when there
 *    is no structured list, so the athlete sees ONE version of the workout.
 *  - "Mejor marca" used `wodScores[0]`, the most RECENT score, not the best →
 *    best is now resolved by metric direction, and the most recent one feeds
 *    the "Tu último <WOD>" autofill on the form.
 *  - `ScoreForm` is replaced by the type-aware `AthleteScoreForm`.
 *
 * getWodForDate and listMyScores are called only here (one section each),
 * so no request-cache dedup needed — direct action calls are fine.
 */

import {
  getWodForDate,
  getMyLastScoreForWOD,
  listMyScores,
  type TodayWOD,
  type MyScoreRow,
  type MyLastScoreForWOD,
} from "@/server/actions/scores";
import AthleteScoreForm from "../AthleteScoreForm";
import { formatScore } from "@/lib/scores";
import { sortByMetric } from "@/lib/scores/direction";
import { formatDayMonth } from "@/lib/week";
import { wodTypeLabel, scoreTypeLabel } from "@/lib/labels";
import type { WODType } from "@prisma/client";
import type { ScoreType } from "@/lib/validations/wod";
import WodDetalleV3, {
  type WodDetalleV3Props,
  type MovementRowData,
} from "@/components/kronos/v3/WodDetalleV3";
import {
  buildWodDayNav,
  todayKeyInTz,
  clampDateKey,
  type WodDayNav,
} from "@/lib/wod-date";
import { getBoxTimezone } from "@/server/cache";
import { requireCachedSession } from "@/server/session";
import WodDayNavBar from "../WodDayNavBar";

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

/**
 * The big label on the movement card and the line under it.
 *
 * The label is the WOD FORMAT ("For Time", "AMRAP 20"); the subtitle is what
 * the score MEASURES. The old code printed "ROUNDS FOR TIME" under every
 * For Time WOD, including Murph, which is a single round.
 */
function roundsLabelFor(wod: NonNullable<TodayWOD>): {
  label: string;
  sub: string;
} {
  const type = wod.wodType as WODType;
  const typeName = wodTypeLabel[type] ?? wod.wodType;
  const scoreName = scoreTypeLabel[wod.scoreType as ScoreType];

  if (type === "AMRAP") {
    return {
      label: wod.timeCap ? `AMRAP ${wod.timeCap}` : "AMRAP",
      sub: scoreName,
    };
  }
  if (type === "EMOM") {
    return {
      label: wod.timeCap ? `EMOM ${wod.timeCap}` : "EMOM",
      sub: scoreName,
    };
  }
  return { label: typeName, sub: scoreName };
}

export async function WodContentSection({ dateParam }: { dateParam?: string }) {
  // Resolve box timezone and dateKey server-side — never Date.now() in client component render.
  let timezone = "UTC";
  try {
    const session = await requireCachedSession();
    timezone = await getBoxTimezone(session.user.tenantId);
  } catch {
    // unauthenticated — fallback
  }

  const todayKey = todayKeyInTz(new Date(), timezone);
  const resolvedKey = dateParam ? clampDateKey(dateParam, timezone) : todayKey;

  const dayNav: WodDayNav = buildWodDayNav(resolvedKey, todayKey);

  let wod: TodayWOD = null;
  let myScores: MyScoreRow[] = [];

  try {
    [wod, myScores] = await Promise.all([
      getWodForDate(resolvedKey),
      listMyScores(20),
    ]);
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
        <WodDayNavBar dayNav={dayNav} />
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            letterSpacing: "0.2em",
            color: "var(--k-t3)",
            fontWeight: 600,
          }}
        >
          {dayNav.headerLabel}
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
          No hay WOD programado para {dayNav.isToday ? "hoy" : "este día"}{" "}
          todavía.
        </p>
      </div>
    );
  }

  const resolvedWod = wod;
  const scoreType = resolvedWod.scoreType as ScoreType;

  let lastScore: MyLastScoreForWOD = null;
  try {
    lastScore = await getMyLastScoreForWOD(resolvedWod.wodId);
  } catch {
    lastScore = null;
  }

  // `listMyScores` is ordered by date, so [0] is the most recent attempt.
  // The BEST attempt needs the metric direction.
  const wodScores = myScores.filter((s) => s.wodId === resolvedWod.wodId);
  const byMetric = sortByMetric(wodScores, (s) => Number(s.value), scoreType);
  const best = byMetric[0];
  const firstAttempt = wodScores[wodScores.length - 1];

  const sparkValues = wodScores
    .slice(0, 5)
    .reverse()
    .map((s) => Number(s.value));

  const delta =
    best && firstAttempt && wodScores.length >= 2
      ? scoreType === "TIME"
        ? `desde ${formatScore(Number(firstAttempt.value), scoreType)}`
        : `desde ${formatScore(Number(firstAttempt.value), scoreType)}`
      : undefined;

  const bestDateLabel = best
    ? `${formatDayMonth(best.createdAt)} · HACE ${Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(best.createdAt).getTime()) / 86400000,
        ),
      )} DÍAS`
    : undefined;

  const movements: MovementRowData[] = resolvedWod.movements.map((m) => {
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

  const rounds = roundsLabelFor(resolvedWod);

  const props: WodDetalleV3Props = {
    wodName: resolvedWod.wodName,
    // Pre-labelled: WodDetalleV3 renders `wodType`/`scoreType` verbatim, so the
    // enum has to be translated at this boundary ("FORTIME" → "For Time").
    wodType: wodTypeLabel[resolvedWod.wodType as WODType] ?? resolvedWod.wodType,
    scoreType: scoreTypeLabel[scoreType],
    timeCap: resolvedWod.timeCap,
    // ONE source of truth for the workout: the free-text block is a fallback
    // for WODs that have no structured movements, never a second version.
    description:
      movements.length > 0
        ? undefined
        : (resolvedWod.description ?? undefined),
    movements,
    roundsLabel: rounds.label,
    roundsSub: rounds.sub,
    bestScore: best ? formatScore(Number(best.value), scoreType) : undefined,
    bestScoreDateLabel: bestDateLabel,
    bestScoreSpark: sparkValues.length >= 2 ? sparkValues : undefined,
    bestScoreDelta: delta,
    leaderboardHref: {
      pathname: "/atleta/leaderboard",
    } as unknown as WodDetalleV3Props["leaderboardHref"],
    backHref: "/atleta",
    hidePrimaryCta: true,
    headerLabel: dayNav.headerLabel,
    dayNavSlot: <WodDayNavBar dayNav={dayNav} />,
    scoreFormSlot: (
      <AthleteScoreForm
        wodId={resolvedWod.wodId}
        wodName={resolvedWod.wodName}
        scoreType={scoreType}
        classId={resolvedWod.classId}
        timeCap={resolvedWod.timeCap}
        lastScore={lastScore}
      />
    ),
  };

  return <WodDetalleV3 {...props} />;
}
