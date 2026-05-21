/**
 * Whoop webhook receiver. Validates HMAC signature, persists the raw event in
 * WebhookEvent (blackbox audit), then fetches the impacted record from Whoop
 * API and upserts via whoop-sync helpers (idempotent by externalId).
 *
 * Endpoint: POST /api/webhooks/whoop
 * Headers required: x-whoop-signature, x-whoop-signature-timestamp
 */

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { logAudit } from "@/server/audit";
import {
  parseWebhookBody,
  verifyWebhookSignature,
  WHOOP_WEBHOOK_SIGNATURE_HEADER,
  WHOOP_WEBHOOK_TIMESTAMP_HEADER,
  type WhoopWebhookEvent,
} from "@/lib/wearables/whoop-webhook";
import {
  ensureFreshToken,
  linkScoresForWorkouts,
  upsertCycles,
  upsertRecoveries,
  upsertSleeps,
  upsertWorkouts,
  WhoopReconnectRequiredError,
} from "@/lib/wearables/whoop-sync";
import {
  fetchCycleById,
  fetchRecoveryByCycleId,
  fetchSleepById,
  fetchWorkoutById,
  WhoopApiError,
} from "@/lib/wearables/whoop-client";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function persistRawEvent(
  tenantId: string | null,
  body: string,
  signatureValid: boolean,
  ok: boolean,
  reason: string,
  externalId: string | null,
): Promise<void> {
  try {
    let payload: object;
    try {
      payload = JSON.parse(body);
    } catch {
      payload = { raw: body };
    }
    await db.webhookEvent.create({
      data: {
        tenantId: tenantId ?? null,
        source: "WHOOP",
        externalId,
        rawPayload: payload as object,
        signatureValid,
        processingStatus: ok ? "PROCESSED" : "REJECTED",
        errorMsg: ok ? null : reason,
        processedAt: new Date(),
      },
    });
  } catch (err) {
    console.warn("[whoop-webhook] failed to persist raw event", err);
  }
}

async function processEvent(
  event: WhoopWebhookEvent,
): Promise<{ ok: boolean; reason: string; tenantId: string | null }> {
  const externalUserId = String(event.user_id);
  const conn = await db.wearableConnection.findUnique({
    where: {
      provider_externalUserId: { provider: "WHOOP", externalUserId },
    },
  });
  if (!conn) {
    return {
      ok: false,
      reason: `no_connection_for_user_${externalUserId}`,
      tenantId: null,
    };
  }
  if (conn.status === "REVOKED") {
    return { ok: false, reason: "connection_revoked", tenantId: conn.tenantId };
  }

  let accessToken: string;
  try {
    const fresh = await ensureFreshToken(conn);
    accessToken = fresh.accessToken;
  } catch (err) {
    if (err instanceof WhoopReconnectRequiredError) {
      return {
        ok: false,
        reason: "reconnect_required",
        tenantId: conn.tenantId,
      };
    }
    throw err;
  }

  const id = event.id;
  switch (event.type) {
    case "workout.updated": {
      const payload = await fetchWorkoutById(accessToken, id);
      const [row] = await upsertWorkouts(
        [payload],
        conn.tenantId,
        conn.athleteId,
      );
      if (row)
        await linkScoresForWorkouts(conn.tenantId, conn.athleteId, [row]);
      return { ok: true, reason: "workout_upserted", tenantId: conn.tenantId };
    }
    case "sleep.updated": {
      const payload = await fetchSleepById(accessToken, id);
      await upsertSleeps([payload], conn.tenantId, conn.athleteId);
      return { ok: true, reason: "sleep_upserted", tenantId: conn.tenantId };
    }
    case "recovery.updated": {
      const payload = await fetchRecoveryByCycleId(accessToken, id);
      await upsertRecoveries([payload], conn.tenantId, conn.athleteId);
      const cycle = await fetchCycleById(accessToken, id);
      await upsertCycles([cycle], conn.tenantId, conn.athleteId);
      return { ok: true, reason: "recovery_upserted", tenantId: conn.tenantId };
    }
    case "user_profile.updated":
    case "user.updated":
      return {
        ok: true,
        reason: "user_event_ignored",
        tenantId: conn.tenantId,
      };
    case "workout.deleted":
    case "sleep.deleted":
    case "recovery.deleted":
      return { ok: true, reason: "delete_ignored", tenantId: conn.tenantId };
    default:
      return {
        ok: true,
        reason: `unknown_type_${event.type}`,
        tenantId: conn.tenantId,
      };
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get(WHOOP_WEBHOOK_SIGNATURE_HEADER);
  const timestamp = req.headers.get(WHOOP_WEBHOOK_TIMESTAMP_HEADER);

  let verify;
  try {
    verify = verifyWebhookSignature({ rawBody, signature, timestamp });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "config_error",
      },
      { status: 503 },
    );
  }
  if (!verify.ok) {
    await persistRawEvent(null, rawBody, false, false, verify.reason, null);
    return NextResponse.json(
      { ok: false, error: verify.reason },
      { status: 401 },
    );
  }

  let event: WhoopWebhookEvent;
  try {
    event = parseWebhookBody(rawBody);
  } catch (err) {
    await persistRawEvent(null, rawBody, true, false, "malformed_body", null);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "malformed_body",
      },
      { status: 400 },
    );
  }

  let result;
  try {
    result = await processEvent(event);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    const isApi = err instanceof WhoopApiError;
    if (isApi && err.status === 404) {
      await persistRawEvent(
        null,
        rawBody,
        true,
        true,
        "payload_404_ignored",
        String(event.id),
      );
      return NextResponse.json({ ok: false, error: "upstream_not_found" });
    }
    await persistRawEvent(
      null,
      rawBody,
      true,
      false,
      `process_error:${message}`,
      String(event.id),
    );
    return NextResponse.json(
      { ok: false, error: "process_error" },
      { status: 500 },
    );
  }

  await persistRawEvent(
    result.tenantId,
    rawBody,
    true,
    result.ok,
    result.reason,
    String(event.id),
  );
  if (result.tenantId) {
    await logAudit({
      tenantId: result.tenantId,
      actorId: null,
      action: "WEBHOOK_RECEIVED",
      targetType: "WhoopEvent",
      targetId: String(event.id),
      metadata: {
        provider: "WHOOP",
        type: event.type,
        externalUserId: event.user_id,
        reason: result.reason,
      },
    });
  }

  return NextResponse.json({ ok: result.ok, reason: result.reason });
}
