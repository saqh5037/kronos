/**
 * Event score parsing/formatting plus the ranking math the athlete-facing
 * event detail needs (audit 2026-09-15: a closed event was "a closed door" —
 * no result, no rank, no explanation).
 */

const INT_RE = /^\d+$/;

function parseSegment(raw: string): number | null {
  if (!INT_RE.test(raw)) return null;
  return Number.parseInt(raw, 10);
}

export function parseTimeToSeconds(input: string): number | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  const parts = trimmed.split(":");
  if (parts.length !== 2 && parts.length !== 3) return null;

  const nums: number[] = [];
  for (const part of parts) {
    const n = parseSegment(part);
    if (n === null) return null;
    nums.push(n);
  }

  if (parts.length === 2) {
    const [mm, ss] = nums;
    if (ss >= 60) return null;
    return mm * 60 + ss;
  }

  const [hh, mm, ss] = nums;
  if (mm >= 60 || ss >= 60) return null;
  return hh * 3600 + mm * 60 + ss;
}

export function formatSecondsToTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(secs)}`;
  return `${pad(minutes)}:${pad(secs)}`;
}

export type RankableEntry = {
  athleteId: string;
  scoreValue: number | null;
  submittedAt: Date | null;
  division: string | null;
};

export type EventRank = {
  position: number;
  outOf: number;
};

/**
 * Rank one athlete inside an event, scoped to their own division.
 *
 * Only submitted entries with a numeric score compete. Event scores are times,
 * so lower is better (the same direction rule the leaderboards use for TIME).
 * Ties share a position — two identical finishes are both #1 and the next
 * athlete is #3 — so the number never claims a decision nobody made.
 *
 * Returns null when the athlete has no comparable submitted score.
 */
export function computeEventRank(
  entries: readonly RankableEntry[],
  athleteId: string,
): EventRank | null {
  const competing = entries.filter(
    (e) =>
      e.submittedAt !== null &&
      typeof e.scoreValue === "number" &&
      Number.isFinite(e.scoreValue),
  );

  const mine = competing.find((e) => e.athleteId === athleteId);
  if (!mine || typeof mine.scoreValue !== "number") return null;

  const sameDivision = competing.filter((e) => e.division === mine.division);
  const myScore = mine.scoreValue;
  const better = sameDivision.filter(
    (e) => (e.scoreValue as number) < myScore,
  ).length;

  return { position: better + 1, outOf: sameDivision.length };
}
