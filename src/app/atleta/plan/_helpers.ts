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
