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

// ─── Paginated reads (Whoop API v2) ──────────────────────────────────────────

export type WhoopPage<T> = {
  records: T[];
  next_token: string | null;
};

export type WhoopCyclePayload = {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string | null;
  timezone_offset: string;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score?: {
    strain?: number;
    kilojoule?: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
  };
};

export type WhoopRecoveryPayload = {
  cycle_id: number;
  sleep_id?: number | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score?: {
    user_calibrating?: boolean;
    recovery_score?: number;
    resting_heart_rate?: number;
    hrv_rmssd_milli?: number;
    spo2_percentage?: number;
    skin_temp_celsius?: number;
  };
};

export type WhoopSleepPayload = {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score?: {
    sleep_performance_percentage?: number;
    sleep_efficiency_percentage?: number;
    stage_summary?: {
      total_in_bed_time_milli?: number;
      total_awake_time_milli?: number;
      total_no_data_time_milli?: number;
      total_light_sleep_time_milli?: number;
      total_slow_wave_sleep_time_milli?: number;
      total_rem_sleep_time_milli?: number;
      sleep_cycle_count?: number;
      disturbance_count?: number;
    };
  };
};

export type WhoopWorkoutPayload = {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_id: number;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score?: {
    strain?: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
    kilojoule?: number;
    zone_duration?: {
      zone_zero_milli?: number;
      zone_one_milli?: number;
      zone_two_milli?: number;
      zone_three_milli?: number;
      zone_four_milli?: number;
      zone_five_milli?: number;
    };
  };
};

type PaginatedQuery = {
  start?: Date | string;
  end?: Date | string;
  limit?: number;
  nextToken?: string;
};

async function getJson<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new WhoopApiError(
      `Whoop API ${res.status} on ${url}`,
      res.status,
      text,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new WhoopApiError("Whoop returned non-JSON body", res.status, text);
  }
}

function buildQuery(path: string, q: PaginatedQuery): string {
  const params = new URLSearchParams();
  if (q.start) {
    params.set(
      "start",
      typeof q.start === "string" ? q.start : q.start.toISOString(),
    );
  }
  if (q.end) {
    params.set("end", typeof q.end === "string" ? q.end : q.end.toISOString());
  }
  params.set("limit", String(Math.min(Math.max(q.limit ?? 25, 1), 25)));
  if (q.nextToken) params.set("nextToken", q.nextToken);
  return `${API_BASE}${path}?${params.toString()}`;
}

export async function fetchCyclesPage(
  accessToken: string,
  q: PaginatedQuery = {},
): Promise<WhoopPage<WhoopCyclePayload>> {
  return getJson(buildQuery("/v2/cycle", q), accessToken);
}

export async function fetchRecoveryPage(
  accessToken: string,
  q: PaginatedQuery = {},
): Promise<WhoopPage<WhoopRecoveryPayload>> {
  return getJson(buildQuery("/v2/recovery", q), accessToken);
}

export async function fetchSleepPage(
  accessToken: string,
  q: PaginatedQuery = {},
): Promise<WhoopPage<WhoopSleepPayload>> {
  return getJson(buildQuery("/v2/activity/sleep", q), accessToken);
}

export async function fetchWorkoutPage(
  accessToken: string,
  q: PaginatedQuery = {},
): Promise<WhoopPage<WhoopWorkoutPayload>> {
  return getJson(buildQuery("/v2/activity/workout", q), accessToken);
}

export async function fetchCycleById(
  accessToken: string,
  id: string | number,
): Promise<WhoopCyclePayload> {
  return getJson(`${API_BASE}/v2/cycle/${id}`, accessToken);
}

export async function fetchRecoveryByCycleId(
  accessToken: string,
  cycleId: string | number,
): Promise<WhoopRecoveryPayload> {
  return getJson(`${API_BASE}/v2/cycle/${cycleId}/recovery`, accessToken);
}

export async function fetchSleepById(
  accessToken: string,
  id: string | number,
): Promise<WhoopSleepPayload> {
  return getJson(`${API_BASE}/v2/activity/sleep/${id}`, accessToken);
}

export async function fetchWorkoutById(
  accessToken: string,
  id: string | number,
): Promise<WhoopWorkoutPayload> {
  return getJson(`${API_BASE}/v2/activity/workout/${id}`, accessToken);
}

/**
 * Fully paginate a Whoop list endpoint into one in-memory array.
 * Caller supplies the page-fetcher. Safety cap of 50 pages × 25 = 1250 records.
 */
export async function paginateAll<T>(
  fetcher: (q: PaginatedQuery) => Promise<WhoopPage<T>>,
  query: PaginatedQuery,
  opts: { maxPages?: number } = {},
): Promise<T[]> {
  const maxPages = opts.maxPages ?? 50;
  const acc: T[] = [];
  let nextToken: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const page: WhoopPage<T> = await fetcher({ ...query, nextToken });
    acc.push(...page.records);
    if (!page.next_token) return acc;
    nextToken = page.next_token;
  }
  return acc;
}
