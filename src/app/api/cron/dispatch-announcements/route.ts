/**
 * Cron endpoint: dispatch SCHEDULED announcements whose scheduledAt <= now.
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`. Si CRON_SECRET no está
 * seteada, el endpoint responde 503 (no se permite correr sin guard).
 *
 * Vercel Cron friendly — agendar en vercel.json:
 *   { "path": "/api/cron/dispatch-announcements", "schedule": "* /5 * * * *" }
 *
 * También invocable desde cron externo:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     https://app.kronos.example/api/cron/dispatch-announcements
 */

import { NextResponse } from "next/server";
import { dispatchAllScheduled } from "@/server/announcements/dispatch";

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

  const summary = await dispatchAllScheduled();
  return NextResponse.json({
    ok: true,
    ...summary,
  });
}
