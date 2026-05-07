/**
 * Cron endpoint: weekly digest email para owners.
 *
 * Itera Boxes con subscriptionStatus ACTIVE o TRIAL (no EXPIRED/CANCELLED).
 * Para cada uno: lookup lastSentAt vía audit log, evalúa shouldSendOwnerDigest
 * (cooldown 6 días), computa data y envía.
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`. Sin CRON_SECRET → 503.
 *
 * Vercel Cron: schedule "0 14 * * 1" (lunes 14:00 UTC = 9am CDMX).
 */
import { NextResponse } from "next/server";
import { db as rawDb } from "@/server/db";
import {
  buildDigestData,
  getLastDigestSentAt,
} from "@/server/owner-digest/compute";
import { shouldSendOwnerDigest } from "@/server/owner-digest/should-send";
import { notifyOwnerDigest } from "@/server/owner-digest/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

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

  // Solo Boxes con suscripción no terminal
  const boxes = await rawDb.box.findMany({
    where: {
      subscriptionStatus: { in: ["ACTIVE", "TRIAL", "PAST_DUE"] },
    },
    select: { id: true },
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const box of boxes) {
    try {
      const lastSentAt = await getLastDigestSentAt(box.id);
      if (!shouldSendOwnerDigest({ lastSentAt, now })) {
        skipped++;
        continue;
      }
      const data = await buildDigestData(box.id, now);
      if (!data) {
        skipped++;
        continue;
      }
      await notifyOwnerDigest(data, box.id);
      sent++;
    } catch (err) {
      console.error(
        `[owner-weekly-digest] failed for tenant ${box.id}:`,
        err instanceof Error ? err.message : err,
      );
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    counts: { sent, skipped, failed, total: boxes.length },
  });
}
