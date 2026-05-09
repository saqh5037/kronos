import { describe, it, expect } from "vitest";
import {
  passwordSchema,
  setPasswordSchema,
  signInWithPasswordSchema,
  PASSWORD_MIN_LENGTH,
} from "@/lib/validations/password";

describe("passwordSchema", () => {
  it("rechaza passwords más cortas que el mínimo", () => {
    const r = passwordSchema.safeParse("ab1");
    expect(r.success).toBe(false);
  });

  it("acepta password justo en el mínimo", () => {
    const just = "a".repeat(PASSWORD_MIN_LENGTH - 1) + "1";
    expect(passwordSchema.safeParse(just).success).toBe(true);
  });

  it("rechaza password sin dígito", () => {
    const r = passwordSchema.safeParse("abcdefghij");
    expect(r.success).toBe(false);
  });

  it("rechaza password sin letra", () => {
    const r = passwordSchema.safeParse("1234567890");
    expect(r.success).toBe(false);
  });

  it("rechaza password muy larga (>128)", () => {
    const r = passwordSchema.safeParse("a1".repeat(70));
    expect(r.success).toBe(false);
  });

  it("acepta password fuerte clásica", () => {
    expect(passwordSchema.safeParse("MiBoxKronos2026!").success).toBe(true);
  });
});

describe("setPasswordSchema", () => {
  it("falla si confirm no coincide", () => {
    const r = setPasswordSchema.safeParse({
      password: "MiBoxKronos2026!",
      confirm: "OtroValor2026!",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("confirm"))).toBe(true);
    }
  });

  it("ok si password y confirm coinciden y la password es válida", () => {
    const r = setPasswordSchema.safeParse({
      password: "MiBoxKronos2026!",
      confirm: "MiBoxKronos2026!",
    });
    expect(r.success).toBe(true);
  });

  it("falla si la password es inválida aunque confirm matchee", () => {
    const r = setPasswordSchema.safeParse({
      password: "shortpw",
      confirm: "shortpw",
    });
    expect(r.success).toBe(false);
  });
});

describe("signInWithPasswordSchema", () => {
  it("acepta email + password no vacíos", () => {
    expect(
      signInWithPasswordSchema.safeParse({
        email: "owner@box.com",
        password: "anything",
      }).success,
    ).toBe(true);
  });

  it("rechaza email mal formado", () => {
    expect(
      signInWithPasswordSchema.safeParse({
        email: "not-an-email",
        password: "anything",
      }).success,
    ).toBe(false);
  });

  it("rechaza password vacía", () => {
    expect(
      signInWithPasswordSchema.safeParse({
        email: "owner@box.com",
        password: "",
      }).success,
    ).toBe(false);
  });
});
