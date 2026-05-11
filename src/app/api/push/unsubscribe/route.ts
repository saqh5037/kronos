import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db as rawDb } from "@/server/db";
import { rateLimit } from "@/lib/rate-limit";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 requests / 5 min per user
  const rl = rateLimit(
    `push-unsubscribe:user:${session.user.id}`,
    10,
    5 * 60_000,
  );
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: `Demasiados intentos. Probá en ${rl.retryAfterSec} segundos.`,
      },
      { status: 429 },
    );
  }

  const body = await req.json();
  const { endpoint } = body as { endpoint: string };

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await rawDb.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
