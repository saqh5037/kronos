import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isSuperAdmin, listSuperAdmins } from "@/lib/super-admin";

const ORIGINAL = process.env.SUPER_ADMIN_EMAILS;

describe("super-admin gate", () => {
  beforeEach(() => {
    process.env.SUPER_ADMIN_EMAILS = "";
  });

  afterEach(() => {
    process.env.SUPER_ADMIN_EMAILS = ORIGINAL;
  });

  describe("isSuperAdmin", () => {
    it("false cuando SUPER_ADMIN_EMAILS vacío", () => {
      process.env.SUPER_ADMIN_EMAILS = "";
      expect(isSuperAdmin("samuel@example.com")).toBe(false);
    });

    it("false cuando SUPER_ADMIN_EMAILS no set", () => {
      delete process.env.SUPER_ADMIN_EMAILS;
      expect(isSuperAdmin("samuel@example.com")).toBe(false);
    });

    it("false para email vacío o null", () => {
      process.env.SUPER_ADMIN_EMAILS = "samuel@example.com";
      expect(isSuperAdmin("")).toBe(false);
      expect(isSuperAdmin(null)).toBe(false);
      expect(isSuperAdmin(undefined)).toBe(false);
    });

    it("true cuando email match exacto", () => {
      process.env.SUPER_ADMIN_EMAILS = "samuel@example.com";
      expect(isSuperAdmin("samuel@example.com")).toBe(true);
    });

    it("case-insensitive (email + lista)", () => {
      process.env.SUPER_ADMIN_EMAILS = "Samuel@Example.com";
      expect(isSuperAdmin("samuel@example.com")).toBe(true);
      expect(isSuperAdmin("SAMUEL@EXAMPLE.COM")).toBe(true);
    });

    it("soporta múltiples emails (comma-separated)", () => {
      process.env.SUPER_ADMIN_EMAILS = "a@x.com, b@y.com ,c@z.com";
      expect(isSuperAdmin("a@x.com")).toBe(true);
      expect(isSuperAdmin("b@y.com")).toBe(true);
      expect(isSuperAdmin("c@z.com")).toBe(true);
      expect(isSuperAdmin("d@w.com")).toBe(false);
    });

    it("ignora whitespace en config", () => {
      process.env.SUPER_ADMIN_EMAILS =
        "   samuel@example.com   ,  otro@example.com  ";
      expect(isSuperAdmin("samuel@example.com")).toBe(true);
      expect(isSuperAdmin("otro@example.com")).toBe(true);
    });

    it("ignora entries vacías", () => {
      process.env.SUPER_ADMIN_EMAILS = "samuel@example.com,,,otro@example.com,";
      expect(listSuperAdmins()).toHaveLength(2);
    });
  });

  describe("listSuperAdmins", () => {
    it("devuelve array con emails autorizados (lowercase)", () => {
      process.env.SUPER_ADMIN_EMAILS = "Samuel@Example.com,Otro@Test.com";
      const all = listSuperAdmins();
      expect(all).toEqual(
        expect.arrayContaining(["samuel@example.com", "otro@test.com"]),
      );
    });

    it("devuelve array vacío si var no set", () => {
      delete process.env.SUPER_ADMIN_EMAILS;
      expect(listSuperAdmins()).toEqual([]);
    });
  });
});
