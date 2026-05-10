import { describe, it, expect } from "vitest";
import {
  deriveOtpFromToken,
  isValidOtpFormat,
  hashEmailToken,
} from "@/server/otp";
import { createHash } from "crypto";

const SECRET = "test-secret-1234567890-abcdefghijklmnop";

describe("deriveOtpFromToken", () => {
  it("devuelve un string de exactamente 6 dígitos", () => {
    const code = deriveOtpFromToken("any-token-here", SECRET);
    expect(code).toMatch(/^\d{6}$/);
    expect(code.length).toBe(6);
  });

  it("es determinístico (mismo token + mismo secret → mismo código)", () => {
    const a = deriveOtpFromToken("token-abc", SECRET);
    const b = deriveOtpFromToken("token-abc", SECRET);
    expect(a).toBe(b);
  });

  it("cambia con el secret (mismo token, secret distinto → distinto código)", () => {
    const a = deriveOtpFromToken("token-abc", SECRET);
    const b = deriveOtpFromToken("token-abc", "otro-secret-distinto");
    expect(a).not.toBe(b);
  });

  it("cambia con el token (secret igual, token distinto → distinto código)", () => {
    const a = deriveOtpFromToken("token-abc", SECRET);
    const b = deriveOtpFromToken("token-xyz", SECRET);
    expect(a).not.toBe(b);
  });

  it("padea con ceros a la izquierda si el resultado <100000", () => {
    // Probamos varios tokens conocidos por producir códigos pequeños.
    // Aunque el output exacto depende del HMAC, lo que validamos es la longitud.
    for (let i = 0; i < 50; i++) {
      const code = deriveOtpFromToken(`token-${i}`, SECRET);
      expect(code).toHaveLength(6);
    }
  });
});

describe("hashEmailToken (NextAuth-compatible)", () => {
  it("reproduce el hash interno de NextAuth: sha256(token + secret)", () => {
    const token = "raw-token-abc";
    const secret = "test-secret";
    const expected = createHash("sha256")
      .update(`${token}${secret}`)
      .digest("hex");
    expect(hashEmailToken(token, secret)).toBe(expected);
  });

  it("es determinístico", () => {
    const a = hashEmailToken("token-1", "secret-1");
    const b = hashEmailToken("token-1", "secret-1");
    expect(a).toBe(b);
  });

  it("cambia con el token o el secret", () => {
    const base = hashEmailToken("token-1", "secret-1");
    expect(hashEmailToken("token-2", "secret-1")).not.toBe(base);
    expect(hashEmailToken("token-1", "secret-2")).not.toBe(base);
  });

  it("OTP del raw + OTP del hash NO matchean (justifica el wrapper)", () => {
    const raw = "raw-token-123";
    const secret = "secret-abc";
    const hashed = hashEmailToken(raw, secret);
    const otpFromRaw = deriveOtpFromToken(raw, secret);
    const otpFromHash = deriveOtpFromToken(hashed, secret);
    // Garantía contra regresión: si alguna vez derivamos del raw en send y
    // del hash en verify (como hacía PR #14 antes del fix), los OTPs son
    // distintos y el flow OTP fallback no funciona.
    expect(otpFromRaw).not.toBe(otpFromHash);
  });
});

describe("isValidOtpFormat", () => {
  it("acepta 6 dígitos exactos", () => {
    expect(isValidOtpFormat("123456")).toBe(true);
    expect(isValidOtpFormat("000000")).toBe(true);
    expect(isValidOtpFormat("999999")).toBe(true);
  });

  it("rechaza largo distinto de 6", () => {
    expect(isValidOtpFormat("12345")).toBe(false);
    expect(isValidOtpFormat("1234567")).toBe(false);
    expect(isValidOtpFormat("")).toBe(false);
  });

  it("rechaza no-dígitos", () => {
    expect(isValidOtpFormat("12345a")).toBe(false);
    expect(isValidOtpFormat("abcdef")).toBe(false);
    expect(isValidOtpFormat("12 345")).toBe(false);
  });

  it("trimea whitespace antes de validar", () => {
    expect(isValidOtpFormat("  123456  ")).toBe(true);
  });
});
