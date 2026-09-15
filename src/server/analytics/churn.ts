"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import type { Severity } from "@/lib/insights/detectors";
import {
  getBoxPeriodTimezone,
  getPeriodSummary,
  type PeriodInput,
} from "../period-summary";

async function requireCoachSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  if (session.user.role === "ATHLETE") throw new Error("Forbidden");
  return session;
}

export type ChurnRiskRow = {
  athleteId: string;
  name: string;
  severity: Severity;
  signalCount: number;
  reasons: string[];
  daysSinceLastAttended: number | null;
};

/**
 * "En riesgo de churn" on /admin/reportes.
 *
 * It used to run `detectChurnRisk`, a multi-signal detector, and reported 0
 * atletas on a box where /admin/atletas reported 3 and /admin/pagos showed 4
 * morosos (audit P0 #6). It now reads the same `AT_RISK_RULE` as every other
 * screen, so the three numbers are the same number.
 */
export async function getChurnRiskList(
  opts?: PeriodInput & { inactivityDays?: number },
): Promise<ChurnRiskRow[]> {
  const session = await requireCoachSession();
  const tenantId = session.user.tenantId;
  const tz = opts?.tz ?? (await getBoxPeriodTimezone(tenantId));

  const summary = await getPeriodSummary(tenantId, {
    preset: opts?.preset,
    from: opts?.from,
    to: opts?.to,
    tz,
    inactivityDays: opts?.inactivityDays,
  });

  return summary.athletes.atRiskRows.map((row) => ({
    athleteId: row.athleteId,
    name: row.name,
    severity: row.severity as Severity,
    signalCount: row.reasons.length,
    reasons: row.reasonLabels,
    daysSinceLastAttended: row.daysSinceLastAttendance,
  }));
}
