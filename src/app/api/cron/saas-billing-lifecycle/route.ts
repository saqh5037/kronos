/**
 * Cron endpoint: lifecycle automation para SaasSubscription + Box.subscriptionStatus.
 *
 * Reglas:
 *  - SaasSubscription ACTIVE con currentPeriodEnd <= now → PAST_DUE
 *  - SaasSubscription PAST_DUE con currentPeriodEnd + 7d < now → EXPIRED + Box → EXPIRED
 *  - Box TRIAL con trialEndsAt <= now → Box.subscriptionStatus EXPIRED
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`. Sin CRON_SECRET → 503.
 *
 * Vercel Cron:
 *   { "path": "/api/cron/saas-billing-lifecycle", "schedule": "0 * * * *" }
 */
import { NextResponse } from "next/server";
import { db as rawDb } from "@/server/db";
import { logAudit } from "@/server/audit";
import { isMockMode } from "@/lib/saas-billing";
import {
  evaluateLifecycle,
  evaluateTrialLifecycle,
  evaluateRenewal,
  shouldNotifyTrialExpiring,
} from "@/server/saas-billing/lifecycle";
import {
  notifyPaymentFailed,
  notifySubscriptionExpired,
  notifyTrialExpiring,
  getLastTrialExpiringNotification,
} from "@/server/saas-billing/notifications";
import { renewSubscriptionMock } from "@/server/saas-billing/renewal";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function unauthorized(reason: string) {
  return NextResponse.json({ ok: false, error: reason }, { status: 401 });
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "CRON_SECRET no configurado. El endpoint está desactivado por seguridad.",
      },
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return unauthorized("Missing Bearer token");
  }
  const token = auth.slice("Bearer ".length).trim();
  if (token !== secret) {
    return unauthorized("Invalid token");
  }

  const now = new Date();
  let toPastDue = 0;
  let toExpired = 0;
  let renewedMock = 0;
  let trialToExpired = 0;
  let trialExpiringNotified = 0;
  const mockMode = isMockMode();

  // ─── SaasSubscriptions ACTIVE / PAST_DUE ─────────────────────────────────────
  const subs = await rawDb.saasSubscription.findMany({
    where: { status: { in: ["ACTIVE", "PAST_DUE"] } },
    select: {
      id: true,
      tenantId: true,
      status: true,
      currentPeriodEnd: true,
    },
  });

  for (const sub of subs) {
    // En mock mode, intentar renovar ACTIVE expirada antes de marcar PAST_DUE.
    // En real mode, MP preapproval dispara el cobro vía webhook (TODO sprint 4.x).
    if (mockMode && sub.status === "ACTIVE") {
      const renewal = evaluateRenewal({
        status: "ACTIVE",
        currentPeriodEnd: sub.currentPeriodEnd,
        now,
      });
      if (renewal.shouldRenew) {
        const r = await renewSubscriptionMock(sub.id, now);
        if (r.ok) {
          renewedMock++;
          continue;
        }
        // Si falló la renovación mock por alguna razón, dejar que el flujo
        // legacy de PAST_DUE se ejecute abajo.
      }
    }

    const result = evaluateLifecycle(
      {
        status: sub.status as "ACTIVE" | "PAST_DUE",
        currentPeriodEnd: sub.currentPeriodEnd,
      },
      now,
    );
    if (!result.changed) continue;

    if (result.nextStatus === "PAST_DUE") {
      await rawDb.$transaction([
        rawDb.saasSubscription.update({
          where: { id: sub.id },
          data: { status: "PAST_DUE" },
        }),
        rawDb.box.update({
          where: { id: sub.tenantId },
          data: { subscriptionStatus: "PAST_DUE" },
        }),
      ]);
      await logAudit({
        tenantId: sub.tenantId,
        actorId: null,
        action: "PAYMENT_FAILED",
        targetType: "SaasSubscription",
        targetId: sub.id,
        metadata: { kind: "SAAS_LIFECYCLE_PAST_DUE" },
      });
      await notifyPaymentFailed(sub.tenantId);
      toPastDue++;
    } else if (result.nextStatus === "EXPIRED") {
      await rawDb.$transaction([
        rawDb.saasSubscription.update({
          where: { id: sub.id },
          data: { status: "EXPIRED" },
        }),
        rawDb.box.update({
          where: { id: sub.tenantId },
          data: { subscriptionStatus: "EXPIRED" },
        }),
      ]);
      await logAudit({
        tenantId: sub.tenantId,
        actorId: null,
        action: "MEMBERSHIP_CANCELLED",
        targetType: "SaasSubscription",
        targetId: sub.id,
        metadata: { kind: "SAAS_LIFECYCLE_EXPIRED" },
      });
      await notifySubscriptionExpired(sub.tenantId);
      toExpired++;
    }
  }

  // ─── Trials que vencieron ────────────────────────────────────────────────────
  const trialBoxes = await rawDb.box.findMany({
    where: { subscriptionStatus: "TRIAL" },
    select: { id: true, trialEndsAt: true, subscriptionStatus: true },
  });

  for (const box of trialBoxes) {
    const result = evaluateTrialLifecycle(
      {
        subscriptionStatus: box.subscriptionStatus,
        trialEndsAt: box.trialEndsAt,
      },
      now,
    );
    if (result.changed) {
      await rawDb.box.update({
        where: { id: box.id },
        data: { subscriptionStatus: "EXPIRED" },
      });
      await logAudit({
        tenantId: box.id,
        actorId: null,
        action: "MEMBERSHIP_CANCELLED",
        targetType: "Box",
        targetId: box.id,
        metadata: { kind: "TRIAL_EXPIRED" },
      });
      await notifySubscriptionExpired(box.id);
      trialToExpired++;
      continue;
    }

    // Trial vigente: ¿avisar que termina pronto?
    const lastNotifiedAt = await getLastTrialExpiringNotification(box.id);
    const decision = shouldNotifyTrialExpiring({
      trialEndsAt: box.trialEndsAt,
      lastNotifiedAt,
      now,
    });
    if (decision.notify && decision.daysRemaining) {
      await notifyTrialExpiring(box.id, decision.daysRemaining);
      trialExpiringNotified++;
    }
  }

  return NextResponse.json({
    ok: true,
    transitions: { toPastDue, toExpired, trialToExpired, renewedMock },
    notifications: { trialExpiring: trialExpiringNotified },
    checked: { subs: subs.length, trialBoxes: trialBoxes.length },
  });
}
