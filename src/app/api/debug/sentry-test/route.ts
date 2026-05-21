import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "endpoint disabled" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json(
      { ok: false, error: "missing bearer" },
      { status: 401 },
    );
  }
  const token = auth.slice("Bearer ".length).trim();
  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(secret);
  if (
    tokenBuf.length !== secretBuf.length ||
    !timingSafeEqual(tokenBuf, secretBuf)
  ) {
    return NextResponse.json(
      { ok: false, error: "invalid token" },
      { status: 401 },
    );
  }

  const dsnPresent = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
  const eventId = Sentry.captureException(
    new Error(
      `Sentry validation probe @ ${new Date().toISOString()} — safe to ignore`,
    ),
  );
  const flushed = await Sentry.flush(5000);

  return NextResponse.json({
    ok: true,
    dsnPresent,
    eventId,
    flushed,
    note: "If eventId is non-empty and flushed=true, Sentry SDK is working.",
  });
}
