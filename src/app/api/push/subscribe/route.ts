import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db as rawDb } from "@/server/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 requests / 5 min per user
  const rl = rateLimit(
    `push-subscribe:user:${session.user.id}`,
    10,
    5 * 60_000,
  );
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: `Demasiados intentos. Intenta en ${rl.retryAfterSec} segundos.`,
      },
      { status: 429 },
    );
  }

  const body = await req.json();
  const { endpoint, keys } = body as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json(
      { error: "Invalid subscription" },
      { status: 400 },
    );
  }

  // Upsert — idempotent by endpoint
  await rawDb.pushSubscription.upsert({
    where: { endpoint },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: req.headers.get("user-agent") ?? undefined,
    },
    create: {
      tenantId: session.user.tenantId,
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: req.headers.get("user-agent") ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
