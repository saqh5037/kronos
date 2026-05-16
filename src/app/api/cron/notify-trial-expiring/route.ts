/**
 * Cron endpoint: notifica Owners de Boxes con trial por terminar (ventana 0-3
 * días) respetando throttle 24h por Box.trialLastNotifiedAt.
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`. Si CRON_SECRET no está
 * seteada, el endpoint responde 503 (desactivado por seguridad).
 *
 * Vercel Cron friendly — agendar en vercel.json:
 *   { "path": "/api/cron/notify-trial-expiring", "schedule": "0 9 * * *" }
 *
 * También invocable externo:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     https://kronos-fit.com/api/cron/notify-trial-expiring
 */

import { NextResponse } from "next/server";
import { dispatchTrialExpiringNotifications } from "@/server/saas-billing/trial-dispatch";

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

  const summary = await dispatchTrialExpiringNotifications();
  return NextResponse.json({
    ok: true,
    ...summary,
  });
}
