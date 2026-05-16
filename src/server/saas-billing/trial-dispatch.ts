/**
 * Dispatch logic compartida entre invocadores del cron diario
 * (/api/cron/notify-trial-expiring) y posibles tools admin futuros.
 *
 * Itera Boxes en TRIAL cuyo trialEndsAt cae dentro de la ventana de aviso
 * (0, 3] días, aplica shouldNotifyTrialExpiring (throttle 24h por
 * trialLastNotifiedAt) y dispara notifyTrialExpiring por cada match.
 *
 * Cero acoplamiento con NextAuth — recibe nothing, lee Box directo.
 */

import { db as prismaBase } from "../db";
import { shouldNotifyTrialExpiring } from "./lifecycle";
import { notifyTrialExpiring } from "./notifications";

export type TrialDispatchSummary = {
  scanned: number;
  notified: number;
  skipped: number;
  errors: Array<{ tenantId: string; error: string }>;
};

export async function dispatchTrialExpiringNotifications(
  now: Date = new Date(),
): Promise<TrialDispatchSummary> {
  // Filtro candidatos en la DB para no traer Boxes que ya están fuera de ventana.
  // Window cap (3 días): trialEndsAt entre (now, now + 3d].
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const candidates = await prismaBase.box.findMany({
    where: {
      subscriptionStatus: "TRIAL",
      trialEndsAt: { gt: now, lte: threeDaysFromNow },
    },
    select: { id: true, trialEndsAt: true, trialLastNotifiedAt: true },
  });

  const summary: TrialDispatchSummary = {
    scanned: candidates.length,
    notified: 0,
    skipped: 0,
    errors: [],
  };

  for (const box of candidates) {
    const decision = shouldNotifyTrialExpiring({
      trialEndsAt: box.trialEndsAt,
      lastNotifiedAt: box.trialLastNotifiedAt,
      now,
    });
    if (!decision.notify || !decision.daysRemaining) {
      summary.skipped += 1;
      continue;
    }
    try {
      await notifyTrialExpiring(box.id, decision.daysRemaining);
      summary.notified += 1;
    } catch (err) {
      summary.errors.push({
        tenantId: box.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return summary;
}
