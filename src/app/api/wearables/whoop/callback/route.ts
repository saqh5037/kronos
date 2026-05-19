import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireCachedSession } from "@/server/session";
import { withTenant } from "@/server/db";
import { logAudit } from "@/server/audit";
import { trackEvent } from "@/lib/analytics";
import { encryptToken } from "@/lib/crypto/token-vault";
import { verifyState, WEARABLE_STATE_COOKIE } from "@/lib/wearables/state";
import {
  exchangeCodeForToken,
  getUserProfile,
  parseScopes,
  WhoopApiError,
} from "@/lib/wearables/whoop-client";

export const dynamic = "force-dynamic";

function redirectWithStatus(baseUrl: URL, params: Record<string, string>) {
  const target = new URL("/atleta/dispositivos", baseUrl);
  for (const [k, v] of Object.entries(params)) {
    target.searchParams.set(k, v);
  }
  return NextResponse.redirect(target);
}

export async function GET(req: Request) {
  const reqUrl = new URL(req.url);

  let session;
  try {
    session = await requireCachedSession();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  const tenantId = session.user.tenantId;

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(WEARABLE_STATE_COOKIE)?.value ?? null;
  cookieStore.delete(WEARABLE_STATE_COOKIE);

  const error = reqUrl.searchParams.get("error");
  if (error) {
    return redirectWithStatus(reqUrl, {
      provider: "whoop",
      error,
    });
  }

  const code = reqUrl.searchParams.get("code");
  const stateParam = reqUrl.searchParams.get("state");
  if (!code || !stateParam) {
    return redirectWithStatus(reqUrl, {
      provider: "whoop",
      error: "missing_code_or_state",
    });
  }

  if (stateParam !== stateCookie) {
    return redirectWithStatus(reqUrl, {
      provider: "whoop",
      error: "state_mismatch",
    });
  }

  const verified = verifyState(stateParam);
  if (!verified.ok) {
    return redirectWithStatus(reqUrl, {
      provider: "whoop",
      error: `state_${verified.reason.toLowerCase()}`,
    });
  }

  const db = withTenant(tenantId);
  const athlete = await db.athlete.findFirst({
    where: { userId: session.user.id, id: verified.payload.athleteId },
    select: { id: true },
  });
  if (!athlete) {
    return redirectWithStatus(reqUrl, {
      provider: "whoop",
      error: "athlete_mismatch",
    });
  }

  let tokens;
  let profile;
  try {
    tokens = await exchangeCodeForToken(code);
    profile = await getUserProfile(tokens.access_token);
  } catch (err) {
    const message =
      err instanceof WhoopApiError
        ? `whoop_api_${err.status}`
        : err instanceof Error
          ? err.message
          : "whoop_api_unknown";
    return redirectWithStatus(reqUrl, {
      provider: "whoop",
      error: message,
    });
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const scopes = parseScopes(tokens.scope);
  const externalUserId = String(profile.user_id);

  const conn = await db.wearableConnection.upsert({
    where: {
      athleteId_provider: { athleteId: athlete.id, provider: "WHOOP" },
    },
    create: {
      tenantId,
      athleteId: athlete.id,
      provider: "WHOOP",
      externalUserId,
      accessToken: encryptToken(tokens.access_token),
      refreshToken: encryptToken(tokens.refresh_token),
      expiresAt,
      scopes,
      status: "CONNECTED",
    },
    update: {
      externalUserId,
      accessToken: encryptToken(tokens.access_token),
      refreshToken: encryptToken(tokens.refresh_token),
      expiresAt,
      scopes,
      status: "CONNECTED",
      lastErrorAt: null,
      lastErrorMessage: null,
    },
  });

  await logAudit({
    tenantId,
    actorId: session.user.id,
    action: "WEARABLE_CONNECTED",
    targetType: "WearableConnection",
    targetId: conn.id,
    metadata: { provider: "WHOOP", externalUserId, scopes },
  });
  await trackEvent("wearable_connected", {
    tenantId,
    actorId: session.user.id,
    provider: "WHOOP",
  });

  return redirectWithStatus(reqUrl, {
    provider: "whoop",
    connected: "1",
  });
}
