/**
 * pilotBetaSignSchema — validation del input de firma piloto-beta.
 */

import { describe, it, expect } from "vitest";
import { pilotBetaSignSchema } from "@/lib/validations/pilot-beta";

describe("pilotBetaSignSchema", () => {
  const valid = {
    token: "valid-token-string-with-enough-length",
    fullName: "Samuel Quiroz",
    acceptTerms: true as const,
    website: "",
  };

  it("acepta input válido", () => {
    const out = pilotBetaSignSchema.safeParse(valid);
    expect(out.success).toBe(true);
  });

  it("rechaza token corto (< 10 chars)", () => {
    const out = pilotBetaSignSchema.safeParse({ ...valid, token: "short" });
    expect(out.success).toBe(false);
  });

  it("rechaza fullName con menos de 3 caracteres", () => {
    const out = pilotBetaSignSchema.safeParse({ ...valid, fullName: "Sa" });
    expect(out.success).toBe(false);
  });

  it("rechaza fullName > 120 chars", () => {
    const out = pilotBetaSignSchema.safeParse({
      ...valid,
      fullName: "x".repeat(121),
    });
    expect(out.success).toBe(false);
  });

  it("rechaza acceptTerms=false (debe ser literal true)", () => {
    const out = pilotBetaSignSchema.safeParse({
      ...valid,
      acceptTerms: false,
    });
    expect(out.success).toBe(false);
  });

  it("acepta website vacío (default honeypot ok)", () => {
    const out = pilotBetaSignSchema.safeParse({ ...valid, website: "" });
    expect(out.success).toBe(true);
  });

  it("trim del fullName", () => {
    const out = pilotBetaSignSchema.safeParse({
      ...valid,
      fullName: "  Samuel Quiroz  ",
    });
    if (out.success) {
      expect(out.data.fullName).toBe("Samuel Quiroz");
    }
  });
});
