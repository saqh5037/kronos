import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Rate limit: 30 requests / 1 min per IP
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`health:ip:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      {
        status: "rate_limited",
        error: `Demasiadas consultas. Intenta en ${rl.retryAfterSec} segundos.`,
      },
      { status: 429 },
    );
  }

  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "ok",
      uptime: process.uptime(),
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        db: "fail",
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
