/**
 * Security tests for the support module helpers.
 *
 * Tests pure functions only (no DB, no HTTP):
 *   - support-code: generation format + normalizeSupportCode
 *   - support-session-token: sign/verify session token
 *   - support-session-token: sign/verify verification token (CRITICAL 2 fix)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateSupportCode, normalizeSupportCode } from "@/lib/support-code";
import {
  signSupportSessionToken,
  verifySupportSessionToken,
  signVerificationToken,
  verifyVerificationToken,
} from "@/lib/support-session-token";

// ─── ENV SETUP ────────────────────────────────────────────────────────────────

const ORIGINAL_SECRET = process.env.SUPPORT_SESSION_SECRET;
const TEST_SECRET = "test-secret-min-16-chars-ok";

beforeEach(() => {
  process.env.SUPPORT_SESSION_SECRET = TEST_SECRET;
});

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.SUPPORT_SESSION_SECRET;
  } else {
    process.env.SUPPORT_SESSION_SECRET = ORIGINAL_SECRET;
  }
});

// ─── SUPPORT CODE ─────────────────────────────────────────────────────────────

describe("generateSupportCode", () => {
  const UNAMBIGUOUS_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const FORBIDDEN_CHARS = ["O", "0", "I", "1", "L"];

  it("produces format KRN-XXXX", () => {
    const code = generateSupportCode();
    expect(code).toMatch(/^KRN-[A-Z0-9]{4}$/);
  });

  it("uses only unambiguous alphabet characters", () => {
    // Generate many codes to increase confidence
    for (let i = 0; i < 200; i++) {
      const code = generateSupportCode();
      const body = code.slice(4); // strip "KRN-"
      for (const ch of body) {
        expect(UNAMBIGUOUS_ALPHABET).toContain(ch);
      }
    }
  });

  it("never contains visually ambiguous characters (O, 0, I, 1, L)", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateSupportCode();
      const body = code.slice(4);
      for (const forbidden of FORBIDDEN_CHARS) {
        expect(body).not.toContain(forbidden);
      }
    }
  });
});

// ─── NORMALIZE SUPPORT CODE ───────────────────────────────────────────────────

describe("normalizeSupportCode", () => {
  it("accepts canonical KRN-XXXX", () => {
    expect(normalizeSupportCode("KRN-A7K2")).toBe("KRN-A7K2");
  });

  it("tolerates lowercase", () => {
    expect(normalizeSupportCode("krn-a7k2")).toBe("KRN-A7K2");
  });

  it("tolerates no dash", () => {
    expect(normalizeSupportCode("KRNA7K2")).toBe("KRN-A7K2");
  });

  it("tolerates spaces (krn a7k2)", () => {
    expect(normalizeSupportCode("krn a7k2")).toBe("KRN-A7K2");
  });

  it("tolerates mixed case with space", () => {
    expect(normalizeSupportCode("Krn A7K2")).toBe("KRN-A7K2");
  });

  it("returns null for invalid code (too short)", () => {
    expect(normalizeSupportCode("KRN-ABC")).toBeNull();
  });

  it("returns null for invalid code (too long)", () => {
    expect(normalizeSupportCode("KRN-ABCDE")).toBeNull();
  });

  it("returns null for wrong prefix", () => {
    expect(normalizeSupportCode("BOX-A7K2")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(normalizeSupportCode("")).toBeNull();
  });
});

// ─── SUPPORT SESSION TOKEN ────────────────────────────────────────────────────

describe("signSupportSessionToken / verifySupportSessionToken", () => {
  const validPayload = {
    sessionId: "sess_abc123",
    boxId: "box_xyz",
    agentId: "user_agent1",
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  it("verify accepts a freshly signed token", () => {
    const token = signSupportSessionToken(validPayload);
    const result = verifySupportSessionToken(token);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.sessionId).toBe(validPayload.sessionId);
      expect(result.payload.boxId).toBe(validPayload.boxId);
    }
  });

  it("rejects tampered payload", () => {
    const token = signSupportSessionToken(validPayload);
    // Flip a character in the payload segment
    const parts = token.split(".");
    const tampered =
      parts[0]!.slice(0, -1) + (parts[0]!.endsWith("A") ? "B" : "A");
    const badToken = `${tampered}.${parts[1]}`;
    const result = verifySupportSessionToken(badToken);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("INVALID_SIGNATURE");
    }
  });

  it("rejects tampered signature", () => {
    const token = signSupportSessionToken(validPayload);
    const parts = token.split(".");
    const badSig =
      parts[1]!.slice(0, -1) + (parts[1]!.endsWith("a") ? "b" : "a");
    const badToken = `${parts[0]}.${badSig}`;
    const result = verifySupportSessionToken(badToken);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("INVALID_SIGNATURE");
    }
  });

  it("rejects expired token", () => {
    const expiredPayload = {
      ...validPayload,
      exp: Math.floor(Date.now() / 1000) - 60, // 1 min ago
    };
    const token = signSupportSessionToken(expiredPayload);
    const result = verifySupportSessionToken(token);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("EXPIRED");
    }
  });

  it("rejects when secret is missing", () => {
    delete process.env.SUPPORT_SESSION_SECRET;
    const result = verifySupportSessionToken("anything");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("MISSING_SECRET");
    }
  });

  it("rejects malformed token (no dot separator)", () => {
    const result = verifySupportSessionToken("nodot");
    expect(result.ok).toBe(false);
  });
});

// ─── VERIFICATION TOKEN (CRITICAL 2 fix) ─────────────────────────────────────

describe("signVerificationToken / verifyVerificationToken", () => {
  const BOX_ID = "box_test_abc";

  it("verify accepts a freshly signed token for the correct boxId", () => {
    const token = signVerificationToken(BOX_ID);
    const result = verifyVerificationToken(token, BOX_ID);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.boxId).toBe(BOX_ID);
    }
  });

  it("rejects tampered payload", () => {
    const token = signVerificationToken(BOX_ID);
    const parts = token.split(".");
    const tampered =
      parts[0]!.slice(0, -1) + (parts[0]!.endsWith("A") ? "B" : "A");
    const result = verifyVerificationToken(`${tampered}.${parts[1]}`, BOX_ID);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("INVALID_SIGNATURE");
    }
  });

  it("rejects tampered signature", () => {
    const token = signVerificationToken(BOX_ID);
    const parts = token.split(".");
    const badSig =
      parts[1]!.slice(0, -1) + (parts[1]!.endsWith("a") ? "b" : "a");
    const result = verifyVerificationToken(`${parts[0]}.${badSig}`, BOX_ID);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("INVALID_SIGNATURE");
    }
  });

  it("rejects expired token", () => {
    // Sign a valid token then verify it as if 6 minutes have passed
    const token = signVerificationToken(BOX_ID);
    const futureDate = new Date(Date.now() + 6 * 60 * 1000); // 6 min later
    const result = verifyVerificationToken(token, BOX_ID, futureDate);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("EXPIRED");
    }
  });

  it("rejects token for a different boxId (BOX_MISMATCH)", () => {
    const token = signVerificationToken(BOX_ID);
    const result = verifyVerificationToken(token, "box_other_id");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("BOX_MISMATCH");
    }
  });

  it("rejects when secret is missing", () => {
    delete process.env.SUPPORT_SESSION_SECRET;
    const result = verifyVerificationToken("anything", BOX_ID);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("MISSING_SECRET");
    }
  });

  it("rejects malformed token", () => {
    const result = verifyVerificationToken("nodot", BOX_ID);
    expect(result.ok).toBe(false);
  });

  it("valid token does NOT accept a different boxId signed for the same box", () => {
    // Token for BOX_ID cannot be used for a completely different box
    const token = signVerificationToken(BOX_ID);
    expect(verifyVerificationToken(token, "completely_different_box").ok).toBe(
      false,
    );
  });
});
