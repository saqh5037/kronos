const AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const REVOKE_URL = "https://api.prod.whoop.com/oauth/oauth2/revoke";
const API_BASE = "https://api.prod.whoop.com/developer";

export const WHOOP_SCOPES = [
  "offline",
  "read:recovery",
  "read:cycles",
  "read:sleep",
  "read:workout",
  "read:profile",
  "read:body_measurement",
] as const;

export type WhoopScope = (typeof WHOOP_SCOPES)[number];

export type WhoopTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

export type WhoopUserProfile = {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
};

function clientConfig(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  const redirectUri = process.env.WHOOP_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Whoop OAuth client is not configured (WHOOP_CLIENT_ID / WHOOP_CLIENT_SECRET / WHOOP_REDIRECT_URI)",
    );
  }
  return { clientId, clientSecret, redirectUri };
}

export function buildAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = clientConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: WHOOP_SCOPES.join(" "),
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export class WhoopApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(message);
    this.name = "WhoopApiError";
  }
}

async function postForm(
  url: string,
  body: URLSearchParams,
): Promise<WhoopTokenResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new WhoopApiError(
      `Whoop token endpoint returned ${res.status}`,
      res.status,
      text,
    );
  }
  try {
    return JSON.parse(text) as WhoopTokenResponse;
  } catch {
    throw new WhoopApiError("Whoop returned non-JSON body", res.status, text);
  }
}

export async function exchangeCodeForToken(
  code: string,
): Promise<WhoopTokenResponse> {
  const { clientId, clientSecret, redirectUri } = clientConfig();
  return postForm(
    TOKEN_URL,
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  );
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<WhoopTokenResponse> {
  const { clientId, clientSecret } = clientConfig();
  return postForm(
    TOKEN_URL,
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: WHOOP_SCOPES.join(" "),
      client_id: clientId,
      client_secret: clientSecret,
    }),
  );
}

export async function revokeAccessToken(accessToken: string): Promise<void> {
  const { clientId, clientSecret } = clientConfig();
  const res = await fetch(REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      token: accessToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok && res.status !== 401) {
    const text = await res.text();
    throw new WhoopApiError(
      `Whoop revoke endpoint returned ${res.status}`,
      res.status,
      text,
    );
  }
}

export async function getUserProfile(
  accessToken: string,
): Promise<WhoopUserProfile> {
  const res = await fetch(`${API_BASE}/v1/user/profile/basic`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new WhoopApiError(
      `Whoop profile endpoint returned ${res.status}`,
      res.status,
      text,
    );
  }
  return JSON.parse(text) as WhoopUserProfile;
}

export function parseScopes(scope: string | undefined | null): string[] {
  if (!scope) return [];
  return scope
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
