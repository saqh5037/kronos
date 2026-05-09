import { describe, it, expect } from "vitest";
import { atletaSignupSchema } from "@/lib/validations/atleta-signup";

describe("atletaSignupSchema", () => {
  const valid = {
    email: "atleta@kronos.app",
    firstName: "Juan",
    lastName: "Pérez",
  };

  it("acepta input válido completo", () => {
    const out = atletaSignupSchema.safeParse(valid);
    expect(out.success).toBe(true);
  });

  it("acepta sin lastName (opcional)", () => {
    const out = atletaSignupSchema.safeParse({
      email: valid.email,
      firstName: valid.firstName,
    });
    expect(out.success).toBe(true);
    if (out.success) expect(out.data.lastName).toBe("");
  });

  it("acepta lastName vacío", () => {
    const out = atletaSignupSchema.safeParse({ ...valid, lastName: "" });
    expect(out.success).toBe(true);
  });

  it("normaliza email a lowercase y trim", () => {
    const out = atletaSignupSchema.safeParse({
      ...valid,
      email: "  ATLETA@KRONOS.app  ",
    });
    expect(out.success).toBe(true);
    if (out.success) expect(out.data.email).toBe("atleta@kronos.app");
  });

  it("rechaza email inválido", () => {
    const out = atletaSignupSchema.safeParse({
      ...valid,
      email: "no-es-email",
    });
    expect(out.success).toBe(false);
  });

  it("rechaza firstName muy corto (<2)", () => {
    const out = atletaSignupSchema.safeParse({ ...valid, firstName: "A" });
    expect(out.success).toBe(false);
  });

  it("rechaza firstName muy largo (>60)", () => {
    const out = atletaSignupSchema.safeParse({
      ...valid,
      firstName: "A".repeat(61),
    });
    expect(out.success).toBe(false);
  });

  it("rechaza lastName muy largo (>60)", () => {
    const out = atletaSignupSchema.safeParse({
      ...valid,
      lastName: "B".repeat(61),
    });
    expect(out.success).toBe(false);
  });

  describe("password (opcional)", () => {
    it("acepta sin password", () => {
      const out = atletaSignupSchema.safeParse(valid);
      expect(out.success).toBe(true);
      if (out.success) expect(out.data.password).toBeUndefined();
    });

    it("acepta password válido (10+ chars con letras y números)", () => {
      const out = atletaSignupSchema.safeParse({
        ...valid,
        password: "password123",
      });
      expect(out.success).toBe(true);
      if (out.success) expect(out.data.password).toBe("password123");
    });

    it("rechaza password muy corto (<10)", () => {
      const out = atletaSignupSchema.safeParse({
        ...valid,
        password: "abc123",
      });
      expect(out.success).toBe(false);
    });

    it("rechaza password sin letras", () => {
      const out = atletaSignupSchema.safeParse({
        ...valid,
        password: "1234567890",
      });
      expect(out.success).toBe(false);
    });

    it("rechaza password sin números", () => {
      const out = atletaSignupSchema.safeParse({
        ...valid,
        password: "passwordxxx",
      });
      expect(out.success).toBe(false);
    });
  });
});
