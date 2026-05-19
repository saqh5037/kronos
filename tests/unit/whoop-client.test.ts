import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import {
  buildAuthorizationUrl,
  parseScopes,
  WHOOP_SCOPES,
  exchangeCodeForToken,
  refreshAccessToken,
  WhoopApiError,
  getUserProfile,
} from "@/lib/wearables/whoop-client";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.WHOOP_CLIENT_ID = "test-client-id";
  process.env.WHOOP_CLIENT_SECRET = "test-client-secret";
  process.env.WHOOP_REDIRECT_URI =
    "http://localhost:3000/api/wearables/whoop/callback";
  vi.restoreAllMocks();
});

afterAll(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("buildAuthorizationUrl", () => {
  it("includes client_id, redirect_uri, scope, state and response_type=code", () => {
    const url = new URL(buildAuthorizationUrl("state-xyz"));
    expect(url.origin + url.pathname).toBe(
      "https://api.prod.whoop.com/oauth/oauth2/auth",
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("test-client-id");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/wearables/whoop/callback",
    );
    expect(url.searchParams.get("state")).toBe("state-xyz");
    expect(url.searchParams.get("scope")).toBe(WHOOP_SCOPES.join(" "));
  });

  it("throws if env not configured", () => {
    delete process.env.WHOOP_CLIENT_ID;
    expect(() => buildAuthorizationUrl("s")).toThrow();
  });
});

describe("parseScopes", () => {
  it("splits space-delimited scope string", () => {
    expect(parseScopes("a b c")).toEqual(["a", "b", "c"]);
  });
  it("collapses multiple whitespace", () => {
    expect(parseScopes("  a   b  c  ")).toEqual(["a", "b", "c"]);
  });
  it("returns empty array for null/undefined/empty", () => {
    expect(parseScopes(null)).toEqual([]);
    expect(parseScopes(undefined)).toEqual([]);
    expect(parseScopes("")).toEqual([]);
  });
});

function mockFetch(impl: typeof fetch) {
  vi.spyOn(globalThis, "fetch").mockImplementation(impl as never);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("exchangeCodeForToken", () => {
  it("sends authorization_code grant and parses response", async () => {
    const calls: Array<{ url: string; body: string }> = [];
    mockFetch(async (input, init) => {
      calls.push({ url: String(input), body: String(init?.body ?? "") });
      return jsonResponse({
        access_token: "at-1",
        refresh_token: "rt-1",
        expires_in: 3600,
        scope: "read:recovery offline",
        token_type: "bearer",
      });
    });

    const out = await exchangeCodeForToken("auth-code-123");
    expect(out.access_token).toBe("at-1");
    expect(out.refresh_token).toBe("rt-1");
    expect(out.expires_in).toBe(3600);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.prod.whoop.com/oauth/oauth2/token");
    expect(calls[0].body).toContain("grant_type=authorization_code");
    expect(calls[0].body).toContain("code=auth-code-123");
    expect(calls[0].body).toContain("client_id=test-client-id");
  });

  it("throws WhoopApiError on 400", async () => {
    mockFetch(async () => jsonResponse({ error: "invalid_grant" }, 400));
    await expect(exchangeCodeForToken("bad-code")).rejects.toBeInstanceOf(
      WhoopApiError,
    );
  });
});

describe("refreshAccessToken", () => {
  it("sends refresh_token grant", async () => {
    const calls: Array<{ body: string }> = [];
    mockFetch(async (_input, init) => {
      calls.push({ body: String(init?.body ?? "") });
      return jsonResponse({
        access_token: "at-2",
        refresh_token: "rt-2",
        expires_in: 3600,
        scope: "read:recovery offline",
        token_type: "bearer",
      });
    });
    const out = await refreshAccessToken("old-refresh");
    expect(out.access_token).toBe("at-2");
    expect(calls[0].body).toContain("grant_type=refresh_token");
    expect(calls[0].body).toContain("refresh_token=old-refresh");
  });

  it("throws WhoopApiError with 401 on invalid refresh", async () => {
    mockFetch(async () => jsonResponse({ error: "invalid_token" }, 401));
    await expect(refreshAccessToken("dead")).rejects.toMatchObject({
      status: 401,
    });
  });
});

describe("getUserProfile", () => {
  it("calls /v1/user/profile/basic with Bearer token", async () => {
    const calls: Array<{ url: string; headers: Record<string, string> }> = [];
    mockFetch(async (input, init) => {
      const headers: Record<string, string> = {};
      const h = init?.headers as Record<string, string> | undefined;
      if (h) for (const [k, v] of Object.entries(h)) headers[k] = String(v);
      calls.push({ url: String(input), headers });
      return jsonResponse({
        user_id: 42,
        email: "a@b.com",
        first_name: "A",
        last_name: "B",
      });
    });
    const out = await getUserProfile("token-z");
    expect(out.user_id).toBe(42);
    expect(out.email).toBe("a@b.com");
    expect(calls[0].url).toContain("/v1/user/profile/basic");
    expect(calls[0].headers.Authorization).toBe("Bearer token-z");
  });
});
