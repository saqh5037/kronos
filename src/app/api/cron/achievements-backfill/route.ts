/**
 * Cron endpoint: re-evaluate achievements for all active athletes.
 * Use case: a new badge has been added to the catalog and we want to
 * retroactively unlock it for athletes who already meet the criteria.
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`. Idempotent —
 * Achievement @@unique guards prevent double-grants.
 *
 * Vercel Cron friendly. Manual:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     https://app.kronos.example/api/cron/achievements-backfill?tenantId=<id>
 *
 * Without `tenantId` param it runs across all tenants.
 */

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { runAchievementEvaluation } from "@/server/achievements/evaluate";

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
  if (!auth?.startsWith("Bearer ")) return unauthorized("Missing Bearer token");
  const token = auth.slice("Bearer ".length).trim();
  if (token !== secret) return unauthorized("Invalid token");

  const url = new URL(req.url);
  const onlyTenant = url.searchParams.get("tenantId");

  const athletes = await db.athlete.findMany({
    where: {
      status: "ACTIVE",
      ...(onlyTenant ? { tenantId: onlyTenant } : {}),
    },
    select: { id: true, tenantId: true },
  });

  let totalUnlocked = 0;
  let xpAwarded = 0;
  const errors: Array<{ athleteId: string; error: string }> = [];

  for (const a of athletes) {
    try {
      const result = await runAchievementEvaluation({
        tenantId: a.tenantId,
        athleteId: a.id,
        trigger: "BACKFILL",
      });
      totalUnlocked += result.unlockedBadges.length;
      xpAwarded += result.xpAwarded;
    } catch (err) {
      errors.push({
        athleteId: a.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    athletesScanned: athletes.length,
    totalUnlocked,
    xpAwarded,
    errors,
  });
}
