/**
 * The three rules that the 2026-09-15 audit found duplicated — with three
 * different definitions — across Pagos, Reportes, the owner dashboard and
 * Atletas (P0 #6, systemic issue S4 "one fact, many numbers").
 *
 * Pure module: no Prisma, no session, no Next APIs.
 *
 * Before this file existed:
 *   - "activos" meant `Athlete.status = ACTIVE` on /admin/atletas (42) and
 *     "seats booked today" on the owner dashboard (27).
 *   - "en riesgo" meant a 14-day inactivity rule on /admin/atletas (3), the
 *     `detectChurnRisk` multi-signal detector on /admin/reportes (0) and the
 *     owner-digest variant of that detector on the dashboard (0).
 *   - "moroso" existed only inside `listOverdueMemberships` (4) and had no
 *     relationship to either at-risk number.
 *
 * From here on there is exactly ONE definition of each, stated below and
 * consumed by every KPI through `getPeriodSummary`.
 */

/** Athlete lifecycle statuses (mirrors `AthleteStatus` in the Prisma schema). */
export type AthleteStatusLike = "ACTIVE" | "PAUSED" | "DROPIN" | "CANCELLED";

/** Membership statuses (mirrors `MembershipStatus` in the Prisma schema). */
export type MembershipStatusLike =
  | "PENDING"
  | "ACTIVE"
  | "PAUSED"
  | "EXPIRED"
  | "CANCELLED";

// ─── Rule 1 · active athlete ────────────────────────────────────────────────

/**
 * ACTIVE ATHLETE = `Athlete.status === "ACTIVE"`.
 *
 * Chosen over "athlete with an ACTIVE membership" because the product means
 * *roster size*: the owner counts the people who belong to the box, and a
 * member whose membership lapsed last Friday has not stopped being a member —
 * they have become a *moroso*, which is a different, separately reported fact
 * (`memberships.overdueCount`). Membership state is still exposed through
 * `memberships.active`, so a screen that really wants "paying members today"
 * has a number to use; it simply must not call it "atletas activos".
 */
export const ACTIVE_ATHLETE_RULE =
  "Atleta activo = Athlete.status === ACTIVE (tamaño del roster). " +
  "Las membresías se reportan aparte en memberships.active / overdueCount.";

export const ACTIVE_ATHLETE_STATUS: AthleteStatusLike = "ACTIVE";

export function isActiveAthlete(athlete: {
  status: AthleteStatusLike | string;
}): boolean {
  return athlete.status === ACTIVE_ATHLETE_STATUS;
}

// ─── Rule 2 · overdue membership ("moroso") ─────────────────────────────────

/**
 * OVERDUE = a membership in `ACTIVE | PENDING | EXPIRED` whose `endDate` is
 * strictly before `now - graceDays`.
 *
 * `PAUSED` is excluded on purpose (the box agreed to stop the clock) and so is
 * `CANCELLED` (the relationship ended; chasing it is collections, not churn).
 * An open-ended membership (`endDate === null`) is never overdue.
 *
 * Amount owed = the sum of the membership's PENDING payments, or the plan
 * price when no payment row exists yet (see `overdueAmountOf`).
 */
export const OVERDUE_RULE =
  "Moroso = membresía ACTIVE|PENDING|EXPIRED con endDate < (ahora - graceDays). " +
  "PAUSED y CANCELLED nunca cuentan; endDate null nunca cuenta. " +
  "Adeudo = suma de pagos PENDING de esa membresía, o el precio del plan si no hay ninguno.";

export const OVERDUE_DEFAULT_GRACE_DAYS = 0;

export const OVERDUE_MEMBERSHIP_STATUSES: MembershipStatusLike[] = [
  "ACTIVE",
  "PENDING",
  "EXPIRED",
];

export function isMembershipOverdue(
  membership: {
    status: MembershipStatusLike | string;
    endDate: Date | null;
  },
  now: Date = new Date(),
  graceDays: number = OVERDUE_DEFAULT_GRACE_DAYS,
): boolean {
  if (!membership.endDate) return false;
  if (
    !OVERDUE_MEMBERSHIP_STATUSES.includes(
      membership.status as MembershipStatusLike,
    )
  ) {
    return false;
  }
  const cutoff = now.getTime() - graceDays * 86400000;
  return membership.endDate.getTime() < cutoff;
}

export function overdueAmountOf(input: {
  pendingAmounts: number[];
  planPrice: number;
}): number {
  const pending = input.pendingAmounts.reduce((acc, n) => acc + n, 0);
  return pending || input.planPrice || 0;
}

// ─── Rule 3 · at-risk athlete ───────────────────────────────────────────────

export type AtRiskReason = "inactivity" | "never_attended" | "overdue";
export type AtRiskSeverity = "low" | "med" | "high";

/**
 * Every signal the rule has, in evaluation order — and the only honest
 * denominator for "N de M señales".
 *
 * `ChurnRiskTable` printed "ALTO · 2/4" over a rule with three signals: the
 * 4 was a literal left behind when the fourth was dropped. The
 * `satisfies` below makes the array and the union fail to compile if they
 * ever disagree again.
 */
export const AT_RISK_REASONS = [
  "inactivity",
  "never_attended",
  "overdue",
] as const satisfies readonly AtRiskReason[];

export type AtRiskEvaluation = {
  atRisk: boolean;
  reasons: AtRiskReason[];
  severity: AtRiskSeverity;
  daysSinceLastAttendance: number | null;
};

/**
 * AT RISK = an ACTIVE athlete who matches at least one signal, evaluated as of
 * the END of the reported period:
 *
 *   1. `inactivity`      — last check-in is older than `inactivityDays` (14).
 *   2. `never_attended`  — never checked in AND joined more than
 *                          `inactivityDays` ago (a member who signed up on
 *                          Monday is not at risk on Tuesday).
 *   3. `overdue`         — holds an overdue membership (rule 2 above).
 *
 * Because signal 3 is rule 2, the overdue holders who are still ACTIVE
 * athletes are a SUBSET of the at-risk list. That is the invariant the audit
 * asked for: the dashboard's at-risk number can never be 0 while Pagos shows
 * 4 morosos.
 *
 * Severity is derived, not stored: it drives ordering only.
 */
export const AT_RISK_RULE =
  "En riesgo = atleta ACTIVE que cumple al menos una señal, evaluada al cierre del período: " +
  "(1) sin check-in hace más de inactivityDays (14 por defecto); " +
  "(2) nunca asistió y se dio de alta hace más de inactivityDays; " +
  "(3) tiene una membresía morosa (regla de moroso). " +
  "Los morosos con atleta ACTIVE son por definición un subconjunto de los atletas en riesgo.";

export const AT_RISK_DEFAULT_INACTIVITY_DAYS = 14;

export function evaluateAtRisk(
  athlete: {
    createdAt: Date;
    lastAttendedAt: Date | null;
    hasOverdueMembership?: boolean;
  },
  asOf: Date = new Date(),
  inactivityDays: number = AT_RISK_DEFAULT_INACTIVITY_DAYS,
): AtRiskEvaluation {
  const cutoff = asOf.getTime() - inactivityDays * 86400000;
  const reasons: AtRiskReason[] = [];

  const daysSinceLastAttendance = athlete.lastAttendedAt
    ? Math.floor((asOf.getTime() - athlete.lastAttendedAt.getTime()) / 86400000)
    : null;

  if (athlete.lastAttendedAt === null) {
    if (athlete.createdAt.getTime() < cutoff) reasons.push("never_attended");
  } else if (athlete.lastAttendedAt.getTime() < cutoff) {
    reasons.push("inactivity");
  }

  if (athlete.hasOverdueMembership) reasons.push("overdue");

  const absence =
    athlete.lastAttendedAt === null
      ? Number.POSITIVE_INFINITY
      : (daysSinceLastAttendance ?? 0);

  let severity: AtRiskSeverity = "low";
  if (reasons.length > 0) {
    if (reasons.length >= 2 || absence >= inactivityDays * 4) {
      severity = "high";
    } else if (absence >= inactivityDays * 2) {
      severity = "med";
    }
  }

  return {
    atRisk: reasons.length > 0,
    reasons,
    severity,
    daysSinceLastAttendance,
  };
}

/** Human-readable Spanish reasons, for the tables that list at-risk athletes. */
export function describeAtRisk(
  evaluation: AtRiskEvaluation,
  inactivityDays: number = AT_RISK_DEFAULT_INACTIVITY_DAYS,
): string[] {
  return evaluation.reasons.map((reason) => {
    switch (reason) {
      case "inactivity":
        return `Sin asistir hace ${evaluation.daysSinceLastAttendance ?? inactivityDays} días`;
      case "never_attended":
        return "Nunca asistió a una clase";
      case "overdue":
        return "Membresía vencida sin pagar";
    }
  });
}

// ─── Shared arithmetic ──────────────────────────────────────────────────────

/**
 * Signed fraction of change between two periods.
 *
 * `previous === 0` is the case every screen got wrong: 0 → anything is not an
 * infinite increase and it is not "no change".
 *   - 0 → 0      ⇒  0    (nothing happened either period)
 *   - 0 → n>0    ⇒  +1   (rendered as "+100%")
 *   - n>0 → 0    ⇒  -1   (rendered as "-100%")
 */
export function deltaPct(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0;
    return current > 0 ? 1 : -1;
  }
  return (current - previous) / previous;
}

/** No-shows over completed bookings (check-ins + no-shows). Never NaN. */
export function noShowRate(input: {
  checkins: number;
  noShows: number;
}): number {
  const completed = input.checkins + input.noShows;
  return completed === 0 ? 0 : input.noShows / completed;
}
