/**
 * Pure badge-progress math (audit 2026-09-15, systemic issue S10).
 *
 * Two bugs this module exists to kill:
 *  1. "17 / 1 clases · 100 %" — the raw counter was printed against the target
 *     without clamping, so an unlocked badge bragged about impossible ratios.
 *  2. "30 días seguidos · 0 %" while the athlete was on day 7 — progress was
 *     read from a stale cache instead of being computed. The ratio here is
 *     always derived from the same counters the criteria evaluator uses.
 *
 * No DB, no Prisma, no React: inputs are numbers, outputs are strings.
 */

export type BadgeProgressView = {
  /** Counter clamped to `target` so an unlocked badge never overshoots. */
  current: number;
  target: number;
  /** 0..1 */
  ratio: number;
  /** 0..100, integer — what the UI prints. */
  percent: number;
  complete: boolean;
};

/**
 * Clamp a raw counter against a target and derive ratio/percent.
 *
 * `target <= 0` means "no measurable target" (e.g. a ratio_pr badge with no
 * bodyweight on file): ratio 0, percent 0, never NaN or Infinity.
 */
export function badgeProgressView(
  rawCurrent: number,
  target: number,
): BadgeProgressView {
  const safeTarget = Number.isFinite(target) && target > 0 ? target : 0;
  const safeRaw =
    Number.isFinite(rawCurrent) && rawCurrent > 0 ? rawCurrent : 0;

  if (safeTarget === 0) {
    return { current: 0, target: 0, ratio: 0, percent: 0, complete: false };
  }

  const current = Math.min(safeRaw, safeTarget);
  const ratio = current / safeTarget;
  return {
    current,
    target: safeTarget,
    ratio,
    percent: Math.round(ratio * 100),
    complete: safeRaw >= safeTarget,
  };
}

/** "7 / 30 días" · "1 / 1 clases" (never "17 / 1 clases"). */
export function badgeProgressHuman(
  rawCurrent: number,
  target: number,
  noun: string,
): string {
  const view = badgeProgressView(rawCurrent, target);
  if (view.target === 0) return noun;
  return `${formatCount(view.current)} / ${formatCount(view.target)} ${noun}`;
}

function formatCount(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/**
 * Icon per badge code. Two-letter text codes ("RW", "FP", "S7") were used as
 * glyphs, which is why unlocked and locked badges looked identical — house
 * rule 1 is SVG only, so every badge resolves to a lucide icon name here.
 *
 * Unknown codes fall back to `Award` so a newly seeded badge still renders a
 * glyph instead of initials.
 */
export type BadgeIconName =
  | "Award"
  | "CalendarCheck"
  | "Flame"
  | "TrendingUp"
  | "ShieldCheck"
  | "Dumbbell"
  | "Medal"
  | "Footprints"
  | "Repeat"
  | "Target";

const BADGE_ICON: Record<string, BadgeIconName> = {
  "first-class": "CalendarCheck",
  "streak-7": "Flame",
  "streak-30": "Flame",
  "first-pr": "TrendingUp",
  "rx-warrior": "ShieldCheck",
  "double-bw-deadlift": "Dumbbell",
  "first-strict-pull-up": "Medal",
  "first-muscle-up-bar": "Medal",
  "first-strict-hspu": "Target",
  "first-pistol": "Footprints",
  "first-double-under": "Repeat",
};

export function badgeIconName(code: string): BadgeIconName {
  return BADGE_ICON[code] ?? "Award";
}

/**
 * Copy for the celebration card, so a first-class badge is not congratulated
 * with "Cada PR cuenta una historia".
 */
export function badgeCelebrationCopy(code: string, name: string): string {
  switch (code) {
    case "first-class":
      return "Tu primera clase ya está en tu historial. El resto se construye encima.";
    case "streak-7":
    case "streak-30":
      return "La constancia es el logro. Sigue sumando días.";
    case "first-pr":
      return "Tu primera marca personal quedó registrada. Ahora hay algo que superar.";
    case "rx-warrior":
      return "Cinco WODs en RX. El estándar completo, sin escalar.";
    case "double-bw-deadlift":
      return "Dos veces tu peso corporal del piso. Eso no se improvisa.";
    default:
      return `${name} desbloqueado. Quedó guardado en tus logros.`;
  }
}
