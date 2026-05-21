/**
 * Cron endpoint: incremental sync de wearables (Whoop por ahora) como backstop
 * en caso de que el webhook falle. Corre cada 1h (configurar en Vercel Cron).
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`. Sigue patrón del resto
 * de cron endpoints de Kronos.
 *
 * Idempotente: upsert por externalId. Sin lock distribuido — si dos workers
 * corren simultáneamente, el último wins. Aceptable porque la fuente de verdad
 * está en Whoop y el resultado es el mismo.
 */

import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/server/db";
import { logAudit } from "@/server/audit";
import { trackEvent } from "@/lib/analytics";
import {
  runIncrementalSync,
  WhoopReconnectRequiredError,
} from "@/lib/wearables/whoop-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const STALE_THRESHOLD_MS = 60 * 60 * 1000;

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
  if (!auth?.startsWith("Bearer ")) return unauthorized("Missing Bearer token");
  const token = auth.slice("Bearer ".length).trim();
  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(secret);
  if (
    tokenBuf.length !== secretBuf.length ||
    !timingSafeEqual(tokenBuf, secretBuf)
  ) {
    return unauthorized("Invalid token");
  }

  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);
  const connections = await db.wearableConnection.findMany({
    where: {
      status: "CONNECTED",
      provider: "WHOOP",
      OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: cutoff } }],
    },
    orderBy: { lastSyncedAt: "asc" },
    take: 200,
  });

  const results: Array<{
    id: string;
    ok: boolean;
    error?: string;
    cycles?: number;
    recoveries?: number;
    sleeps?: number;
    workouts?: number;
    linkedScores?: number;
  }> = [];

  for (const conn of connections) {
    try {
      const outcome = await runIncrementalSync(conn.id);
      results.push({
        id: conn.id,
        ok: true,
        cycles: outcome.cycles,
        recoveries: outcome.recoveries,
        sleeps: outcome.sleeps,
        workouts: outcome.workouts,
        linkedScores: outcome.linkedScores,
      });
      await trackEvent("wearable_sync_completed", {
        tenantId: conn.tenantId,
        actorId: null,
        provider: "WHOOP",
        cycles: outcome.cycles,
        recoveries: outcome.recoveries,
        sleeps: outcome.sleeps,
        workouts: outcome.workouts,
      });
    } catch (err) {
      const isReconnect = err instanceof WhoopReconnectRequiredError;
      const message = err instanceof Error ? err.message : "unknown_sync_error";
      results.push({ id: conn.id, ok: false, error: message });
      await logAudit({
        tenantId: conn.tenantId,
        actorId: null,
        action: isReconnect
          ? "WEARABLE_RECONNECT_REQUIRED"
          : "WEARABLE_SYNC_FAILED",
        targetType: "WearableConnection",
        targetId: conn.id,
        metadata: { provider: conn.provider, error: message },
      });
      await trackEvent("wearable_sync_failed", {
        tenantId: conn.tenantId,
        actorId: null,
        provider: conn.provider,
        reconnect: isReconnect,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: connections.length,
    results,
  });
}
