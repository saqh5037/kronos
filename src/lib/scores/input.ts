/**
 * Pure parsers/formatters for the athlete score form.
 *
 * Audit 2026-09-15 (P1, athlete app): the form invited wrong data — a free
 * "UNIDAD" text field prefilled with "s" next to an "ej. 5:30" placeholder on a
 * 60-minute cap, and no way to say "I hit the cap at N reps". The form is now
 * type-aware and every conversion between what the athlete types and what the
 * DB stores lives here, tested, instead of inline in the component.
 *
 * Storage contract (unchanged):
 *   TIME        → seconds
 *   REPS        → reps
 *   WEIGHT      → kg
 *   ROUNDS_REPS → packed decimal `rounds.reps` (reps as hundredths, 0..99)
 */

/** Longest time we accept: 9:59:59. Guards against typos like "999999". */
const MAX_TIME_SECONDS = 9 * 3600 + 59 * 60 + 59;

/**
 * Parse what a human typed into seconds.
 * Accepts "mm:ss", "h:mm:ss", and a bare number (read as seconds).
 * Returns null for anything malformed or out of range — never NaN.
 */
export function parseTimeToSeconds(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  if (!trimmed.includes(":")) {
    if (!/^\d+$/.test(trimmed)) return null;
    const seconds = Number(trimmed);
    return seconds <= MAX_TIME_SECONDS ? seconds : null;
  }

  const parts = trimmed.split(":");
  if (parts.length > 3) return null;
  if (!parts.every((p) => /^\d{1,2}$/.test(p))) return null;

  const nums = parts.map(Number);
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  if (nums.length === 3) [hours, minutes, seconds] = nums;
  else [minutes, seconds] = nums;

  if (seconds > 59) return null;
  if (nums.length === 3 && minutes > 59) return null;

  const total = hours * 3600 + minutes * 60 + seconds;
  return total <= MAX_TIME_SECONDS ? total : null;
}

/** Seconds → "mm:ss", or "h:mm:ss" once it passes an hour. */
export function formatSecondsAsTime(total: number): string {
  const safe = Math.max(0, Math.round(total));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`;
}

/**
 * Progressive mm:ss mask for an `onChange` handler: the athlete types digits
 * and the colon appears by itself. "4120" → "41:20", "412030" → "41:20:30".
 * Non-digits are dropped, so a pasted "41m20s" still lands as "41:20".
 */
export function maskTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, -2)}:${digits.slice(-2)}`;
  return `${digits.slice(0, -4)}:${digits.slice(-4, -2)}:${digits.slice(-2)}`;
}

/** Pack a rounds + partial-reps pair into the stored decimal. */
export function parseRoundsReps(
  rounds: number | string,
  reps: number | string,
): number | null {
  const r = typeof rounds === "number" ? rounds : Number(rounds.trim() || "0");
  const p = typeof reps === "number" ? reps : Number(reps.trim() || "0");
  if (!Number.isFinite(r) || !Number.isFinite(p)) return null;
  if (r < 0 || p < 0 || p > 99) return null;
  if (!Number.isInteger(r) || !Number.isInteger(p)) return null;
  return r + p / 100;
}

/** Inverse of `parseRoundsReps`. */
export function unpackRoundsReps(value: number): {
  rounds: number;
  reps: number;
} {
  const safe = Math.max(0, value);
  const rounds = Math.floor(safe);
  const reps = Math.round((safe - rounds) * 100);
  // 5.995 would round to 5 + 100 — carry it into the next round.
  if (reps >= 100) return { rounds: rounds + 1, reps: 0 };
  return { rounds, reps };
}

/** "5+12" text form, for the autofill line and the leaderboard. */
export function formatRoundsReps(value: number): string {
  const { rounds, reps } = unpackRoundsReps(value);
  return `${rounds}+${reps}`;
}

export const WEIGHT_STEP_KG = 2.5;
const MAX_WEIGHT_KG = 500;

/** Clamp + round a kg input to the nearest 0.5 kg the plates allow. */
export function clampWeight(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const clamped = Math.min(MAX_WEIGHT_KG, Math.max(0, value));
  return Math.round(clamped * 2) / 2;
}

/** kg stepper: +/- 2.5 kg by default, never below 0. */
export function stepWeight(value: number, steps: number): number {
  return clampWeight(value + steps * WEIGHT_STEP_KG);
}

const MAX_REPS = 9999;

/** Reps counter: integers only, clamped. */
export function stepReps(value: number, steps: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(MAX_REPS, Math.max(0, Math.round(value) + steps));
}
