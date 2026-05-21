import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createHmac } from "node:crypto";
import {
  verifyWebhookSignature,
  parseWebhookBody,
} from "@/lib/wearables/whoop-webhook";

const ORIGINAL_SECRET = process.env.WHOOP_WEBHOOK_SECRET;
const TEST_SECRET = "x".repeat(32);

function sign(timestampMs: number, body: string, secret = TEST_SECRET): string {
  return createHmac("sha256", secret)
    .update(String(timestampMs) + body)
    .digest("base64");
}

beforeEach(() => {
  process.env.WHOOP_WEBHOOK_SECRET = TEST_SECRET;
});

afterAll(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.WHOOP_WEBHOOK_SECRET;
  } else {
    process.env.WHOOP_WEBHOOK_SECRET = ORIGINAL_SECRET;
  }
});

describe("verifyWebhookSignature", () => {
  it("accepts a valid signature within skew window", () => {
    const now = 1_700_000_000_000;
    const body = JSON.stringify({
      id: 1,
      user_id: 42,
      type: "workout.updated",
    });
    const sig = sign(now, body);
    expect(
      verifyWebhookSignature({
        rawBody: body,
        signature: sig,
        timestamp: String(now),
        now,
      }),
    ).toEqual({ ok: true });
  });

  it("rejects missing signature header", () => {
    const r = verifyWebhookSignature({
      rawBody: "{}",
      signature: null,
      timestamp: "1700000000000",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("MISSING_HEADERS");
  });

  it("rejects missing timestamp header", () => {
    const r = verifyWebhookSignature({
      rawBody: "{}",
      signature: "sig",
      timestamp: null,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("MISSING_HEADERS");
  });

  it("rejects non-numeric timestamp", () => {
    const r = verifyWebhookSignature({
      rawBody: "{}",
      signature: "sig",
      timestamp: "not-a-number",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects skew greater than 5 minutes", () => {
    const now = 1_700_000_000_000;
    const stale = now - 6 * 60 * 1000;
    const body = "{}";
    const sig = sign(stale, body);
    const r = verifyWebhookSignature({
      rawBody: body,
      signature: sig,
      timestamp: String(stale),
      now,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("SKEW_TOO_LARGE");
  });

  it("rejects tampered body (signature mismatch)", () => {
    const now = 1_700_000_000_000;
    const body = JSON.stringify({
      id: 1,
      user_id: 42,
      type: "workout.updated",
    });
    const sig = sign(now, body);
    const tampered = body.replace("workout", "workorz");
    const r = verifyWebhookSignature({
      rawBody: tampered,
      signature: sig,
      timestamp: String(now),
      now,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("BAD_SIGNATURE");
  });

  it("rejects signature signed with wrong secret", () => {
    const now = 1_700_000_000_000;
    const body = "{}";
    const sig = sign(now, body, "y".repeat(32));
    const r = verifyWebhookSignature({
      rawBody: body,
      signature: sig,
      timestamp: String(now),
      now,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("BAD_SIGNATURE");
  });

  it("rejects signature of wrong length without crashing", () => {
    const now = 1_700_000_000_000;
    const r = verifyWebhookSignature({
      rawBody: "{}",
      signature: "short",
      timestamp: String(now),
      now,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("BAD_SIGNATURE");
  });

  it("throws if secret missing", () => {
    delete process.env.WHOOP_WEBHOOK_SECRET;
    expect(() =>
      verifyWebhookSignature({
        rawBody: "{}",
        signature: "x",
        timestamp: "1700000000000",
        now: 1700000000000,
      }),
    ).toThrow(/WHOOP_WEBHOOK_SECRET/);
  });
});

describe("parseWebhookBody", () => {
  it("parses a well-formed event", () => {
    const out = parseWebhookBody(
      JSON.stringify({ id: 99, user_id: 7, type: "workout.updated" }),
    );
    expect(out).toEqual({ id: 99, user_id: 7, type: "workout.updated" });
  });

  it("rejects body without id", () => {
    expect(() =>
      parseWebhookBody(JSON.stringify({ user_id: 7, type: "workout.updated" })),
    ).toThrow(/Malformed/);
  });

  it("rejects body without user_id", () => {
    expect(() =>
      parseWebhookBody(JSON.stringify({ id: 1, type: "workout.updated" })),
    ).toThrow(/Malformed/);
  });

  it("rejects body without type", () => {
    expect(() =>
      parseWebhookBody(JSON.stringify({ id: 1, user_id: 7 })),
    ).toThrow(/Malformed/);
  });

  it("rejects null body", () => {
    expect(() => parseWebhookBody("null")).toThrow(/Malformed/);
  });
});
