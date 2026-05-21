import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createHmac } from "node:crypto";
import {
  signState,
  verifyState,
  WEARABLE_STATE_TTL_MS,
} from "@/lib/wearables/state";

const ORIGINAL_SECRET = process.env.WHOOP_STATE_SECRET;

function setSecret(value: string | undefined): void {
  if (value === undefined) {
    delete process.env.WHOOP_STATE_SECRET;
  } else {
    process.env.WHOOP_STATE_SECRET = value;
  }
}

beforeEach(() => {
  setSecret("a".repeat(64));
});

afterAll(() => {
  setSecret(ORIGINAL_SECRET);
});

describe("wearables state signing", () => {
  it("signState produces a body.signature token", () => {
    const state = signState("athlete-abc");
    expect(state.split(".")).toHaveLength(2);
  });

  it("verifyState recovers the original athleteId", () => {
    const state = signState("athlete-abc");
    const result = verifyState(state);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.athleteId).toBe("athlete-abc");
      expect(typeof result.payload.nonce).toBe("string");
      expect(typeof result.payload.issuedAt).toBe("number");
    }
  });

  it("two consecutive signs produce different states (random nonce)", () => {
    const a = signState("athlete-abc");
    const b = signState("athlete-abc");
    expect(a).not.toBe(b);
  });

  it("verifyState rejects null and undefined", () => {
    expect(verifyState(null).ok).toBe(false);
    expect(verifyState(undefined).ok).toBe(false);
  });

  it("verifyState rejects malformed input", () => {
    const r = verifyState("not-a-token");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("MALFORMED");
  });

  it("verifyState rejects empty halves", () => {
    expect(verifyState(".sig").ok).toBe(false);
    expect(verifyState("body.").ok).toBe(false);
  });

  it("verifyState rejects tampered body", () => {
    const state = signState("athlete-abc");
    const [body, sig] = state.split(".");
    const tampered = `${body}x.${sig}`;
    const r = verifyState(tampered);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("BAD_SIGNATURE");
  });

  it("verifyState rejects signature with wrong secret", () => {
    const state = signState("athlete-abc");
    setSecret("b".repeat(64));
    const r = verifyState(state);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("BAD_SIGNATURE");
  });

  it("verifyState rejects expired states", () => {
    const state = signState("athlete-abc");
    const [body] = state.split(".");
    const decoded = JSON.parse(
      Buffer.from(
        body.replace(/-/g, "+").replace(/_/g, "/") +
          "=".repeat((4 - (body.length % 4)) % 4),
        "base64",
      ).toString("utf8"),
    );
    decoded.issuedAt = Date.now() - WEARABLE_STATE_TTL_MS - 1000;

    const forgedBody = Buffer.from(JSON.stringify(decoded), "utf8")
      .toString("base64")
      .replace(/=+$/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const sig = createHmac("sha256", process.env.WHOOP_STATE_SECRET!)
      .update(forgedBody)
      .digest("base64")
      .replace(/=+$/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const r = verifyState(`${forgedBody}.${sig}`);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("EXPIRED");
  });

  it("signState throws if secret missing", () => {
    setSecret(undefined);
    expect(() => signState("athlete-abc")).toThrow(/WHOOP_STATE_SECRET/);
  });

  it("signState throws if secret too short", () => {
    setSecret("short");
    expect(() => signState("athlete-abc")).toThrow(/WHOOP_STATE_SECRET/);
  });
});
