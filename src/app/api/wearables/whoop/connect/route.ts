import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireCachedSession } from "@/server/session";
import { withTenant } from "@/server/db";
import {
  signState,
  WEARABLE_STATE_COOKIE,
  WEARABLE_STATE_TTL_MS,
} from "@/lib/wearables/state";
import { buildAuthorizationUrl } from "@/lib/wearables/whoop-client";

export const dynamic = "force-dynamic";

export async function GET() {
  let session;
  try {
    session = await requireCachedSession();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const db = withTenant(session.user.tenantId);
  const athlete = await db.athlete.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) {
    console.warn("[wearables/connect] athlete profile missing for session", {
      userId: session.user.id,
      tenantId: session.user.tenantId,
    });
    return NextResponse.json(
      { ok: false, error: "Athlete profile not found" },
      { status: 404 },
    );
  }

  const state = signState(athlete.id);

  const cookieStore = await cookies();
  cookieStore.set(WEARABLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(WEARABLE_STATE_TTL_MS / 1000),
  });

  let authUrl: string;
  try {
    authUrl = buildAuthorizationUrl(state);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Whoop OAuth not configured",
      },
      { status: 503 },
    );
  }

  return NextResponse.redirect(authUrl);
}
