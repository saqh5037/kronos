/** Pure helpers for the /atleta/plan page — exported separately to allow unit tests
 *  without importing the Next.js page module (which triggers server-action checks). */

import { goalMetricLabel as GOAL_METRIC_LABEL } from "@/lib/labels";
import {
  daysUntil,
  formatDaysUntil,
  formatDeadlineWithCountdown,
} from "@/lib/scores/copy";
import type { GoalMetric } from "@prisma/client";

/**
 * Enum → Spanish. Delegates to the shared `@/lib/labels` map so there is one
 * dictionary in the codebase; the local default keeps the old fallback for a
 * metric the map does not know.
 */
export function goalMetricLabel(metric: string): string {
  return GOAL_METRIC_LABEL[metric as GoalMetric] ?? "objetivo";
}

/**
 * Audit 2026-09-15 (P2 copy, /atleta/plan): "3 DE OCTUBRE DE 2026" in uppercase
 * mono took a full line and told the athlete nothing actionable. The deadline
 * now leads with the countdown: "faltan 18 días · 3 oct".
 */
export function formatDeadline(date: Date, now: Date = new Date()): string {
  return formatDeadlineWithCountdown(date, now);
}

/** Just the countdown, for places that already show the date. */
export function formatDeadlineCountdown(
  date: Date,
  now: Date = new Date(),
): string {
  return formatDaysUntil(date, now);
}

/** Normalizes a raw goalId param: trims whitespace, returns null if empty. */
export function normalizeGoalId(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Which goal the page opens on when no `goalId` is in the URL: the active goal
 * with the nearest deadline. The audit's complaint was that an athlete with an
 * AI plan landed on "Elige el objetivo…" and 70 % empty space — the plan should
 * be the page, the picker a secondary control.
 */
export function pickDefaultGoal<T extends { deadline: Date; status: string }>(
  goals: readonly T[],
): T | null {
  const active = goals.filter((g) => g.status === "ACTIVE");
  if (active.length === 0) return null;
  return [...active].sort(
    (a, b) => a.deadline.getTime() - b.deadline.getTime(),
  )[0];
}

/**
 * Which week of the plan the athlete is in right now.
 *
 * The plan is generated to fill the time left until the deadline, so the weeks
 * remaining tell us how far along it is: with 4 weeks left of a 6-week plan the
 * athlete is in week 3. Clamped into [1, totalWeeks]; a passed deadline pins to
 * the last week rather than running off the end.
 */
export function currentPlanWeek(
  totalWeeks: number,
  deadline: Date,
  now: Date = new Date(),
): number {
  if (totalWeeks <= 0) return 0;
  const weeksLeft = Math.ceil(Math.max(0, daysUntil(deadline, now)) / 7);
  const week = totalWeeks - weeksLeft + 1;
  return Math.min(totalWeeks, Math.max(1, week));
}

/**
 * Session type shown on the plan chips.
 *
 * These strings do NOT come from Prisma: `src/lib/ai/training-plan.ts` asks
 * Gemini for `"type": "Fuerza | Met-Con | Recovery"` and falls back to a
 * literal `"—"` when the model returns nothing usable. So the chip printed
 * whatever the model felt like — including an em dash on its own, or an
 * English `RECOVERY` in caps next to Spanish copy (the `raw-enum-jsx` guard
 * flags `{s.type}` for exactly this shape).
 *
 * Known values get the house label; anything else is humanised rather than
 * dropped, because the model inventing "Gimnasia" is useful information and
 * hiding it would be worse than showing it well.
 */
const PLAN_SESSION_TYPE_LABEL: Record<string, string> = {
  fuerza: "Fuerza",
  strength: "Fuerza",
  "met-con": "Met-Con",
  metcon: "Met-Con",
  "metabolic conditioning": "Met-Con",
  cardio: "Cardio",
  recovery: "Recuperación",
  recuperación: "Recuperación",
  descanso: "Descanso",
  rest: "Descanso",
  movilidad: "Movilidad",
  mobility: "Movilidad",
  skill: "Técnica",
  técnica: "Técnica",
  gimnasia: "Gimnasia",
  gymnastics: "Gimnasia",
};

/** Placeholder the plan generator emits when the model gives it nothing. */
const PLAN_SESSION_TYPE_FALLBACK = "Sesión";

/**
 * Humanises an unknown value: `ROUNDS_REPS` → `Rounds reps`, `  met con ` →
 * `Met con`. Never returns an empty string and never returns a bare glyph.
 */
function humanizeSessionType(raw: string): string {
  const cleaned = raw.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  if (cleaned.length === 0) return PLAN_SESSION_TYPE_FALLBACK;
  // A value with no letter at all is a placeholder ("—", "-", "?"), not a type.
  if (!/\p{L}/u.test(cleaned)) return PLAN_SESSION_TYPE_FALLBACK;
  const lower = /^[^\p{Ll}]+$/u.test(cleaned) ? cleaned.toLowerCase() : cleaned;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** The label for a plan session chip. Always safe to render. */
export function planSessionTypeLabel(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) return PLAN_SESSION_TYPE_FALLBACK;
  const key = raw.trim().toLowerCase();
  return PLAN_SESSION_TYPE_LABEL[key] ?? humanizeSessionType(raw);
}
