/**
 * Cron endpoint: genera coach cards semanales para atletas activos.
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`. Sin secret → 503.
 *
 * Vercel Cron friendly — agendar en vercel.json:
 *   { "path": "/api/cron/generate-coach-cards", "schedule": "0 6 * * 1" }
 *   (lunes 6am UTC = lunes 12am CDMX)
 *
 * Cada atleta con cards frescas (<7 días) se skipea (idempotente).
 */

import { NextResponse } from "next/server";
import { generateCoachCardsBatch } from "@/server/actions/coach-cards";
import { reportError } from "@/lib/observability";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
  const provided = auth.slice("Bearer ".length).trim();
  if (provided !== secret) {
    return unauthorized("Invalid token");
  }

  try {
    const start = Date.now();
    const result = await generateCoachCardsBatch();
    const ms = Date.now() - start;
    return NextResponse.json({
      ok: true,
      athletesProcessed: result.athletesProcessed,
      cardsGenerated: result.cardsGenerated,
      durationMs: ms,
    });
  } catch (err) {
    reportError("cron/generate-coach-cards", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
