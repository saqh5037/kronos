import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { randomBytes } from "node:crypto";
import {
  encryptToken,
  decryptToken,
  __resetTokenVaultForTests,
} from "@/lib/crypto/token-vault";

const ORIGINAL_KEY = process.env.WEARABLES_TOKEN_ENCRYPTION_KEY;

function setKey(keyBase64: string | undefined): void {
  if (keyBase64 === undefined) {
    delete process.env.WEARABLES_TOKEN_ENCRYPTION_KEY;
  } else {
    process.env.WEARABLES_TOKEN_ENCRYPTION_KEY = keyBase64;
  }
  __resetTokenVaultForTests();
}

beforeEach(() => {
  setKey(randomBytes(32).toString("base64"));
});

afterAll(() => {
  setKey(ORIGINAL_KEY);
});

describe("token-vault", () => {
  it("round-trip encrypt/decrypt restores original plaintext", () => {
    const plain = "whoop-refresh-token-xyz-1234567890";
    const ct = encryptToken(plain);
    expect(ct).not.toBe(plain);
    expect(decryptToken(ct)).toBe(plain);
  });

  it("each encryption produces a different ciphertext (random IV)", () => {
    const plain = "same-plain";
    const a = encryptToken(plain);
    const b = encryptToken(plain);
    expect(a).not.toBe(b);
    expect(decryptToken(a)).toBe(plain);
    expect(decryptToken(b)).toBe(plain);
  });

  it("output is valid base64", () => {
    const ct = encryptToken("hello");
    expect(() => Buffer.from(ct, "base64")).not.toThrow();
    expect(Buffer.from(ct, "base64").toString("base64")).toBe(ct);
  });

  it("rejects empty plaintext", () => {
    expect(() => encryptToken("")).toThrow(/non-empty/);
  });

  it("rejects empty ciphertext", () => {
    expect(() => decryptToken("")).toThrow(/non-empty/);
  });

  it("rejects malformed ciphertext", () => {
    expect(() => decryptToken("not-real-ciphertext")).toThrow();
  });

  it("detects tampering of the auth tag", () => {
    const ct = encryptToken("secret-payload");
    const buf = Buffer.from(ct, "base64");
    buf[15] = buf[15] ^ 0xff;
    const tampered = buf.toString("base64");
    expect(() => decryptToken(tampered)).toThrow();
  });

  it("detects tampering of the body", () => {
    const ct = encryptToken("secret-payload");
    const buf = Buffer.from(ct, "base64");
    buf[buf.length - 1] = buf[buf.length - 1] ^ 0xff;
    const tampered = buf.toString("base64");
    expect(() => decryptToken(tampered)).toThrow();
  });

  it("fails to decrypt with a different key (cross-key isolation)", () => {
    const plain = "secret-payload";
    const ct = encryptToken(plain);

    setKey(randomBytes(32).toString("base64"));
    expect(() => decryptToken(ct)).toThrow();
  });

  it("throws when key is missing", () => {
    setKey(undefined);
    expect(() => encryptToken("x")).toThrow(/WEARABLES_TOKEN_ENCRYPTION_KEY/);
  });

  it("throws when key is the wrong length", () => {
    setKey(Buffer.from("too-short").toString("base64"));
    expect(() => encryptToken("x")).toThrow(/32 bytes/);
  });

  it("handles long payloads (typical refresh tokens are ~200 chars)", () => {
    const plain = "x".repeat(2048);
    const ct = encryptToken(plain);
    expect(decryptToken(ct)).toBe(plain);
  });

  it("handles unicode payloads correctly", () => {
    const plain = "token-with-emoji-🔐-and-acentos-áéíóú";
    expect(decryptToken(encryptToken(plain))).toBe(plain);
  });
});
