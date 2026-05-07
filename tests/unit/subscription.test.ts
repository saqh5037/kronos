import { describe, it, expect } from "vitest";
import { shouldRedirectToBilling } from "@/lib/subscription";

describe("shouldRedirectToBilling", () => {
  describe("EXPIRED status", () => {
    it("redirige desde /admin", () => {
      expect(shouldRedirectToBilling("EXPIRED", "/admin")).toBe(true);
    });

    it("redirige desde /admin/atletas", () => {
      expect(shouldRedirectToBilling("EXPIRED", "/admin/atletas")).toBe(true);
    });

    it("redirige desde /admin/clases/123", () => {
      expect(shouldRedirectToBilling("EXPIRED", "/admin/clases/123")).toBe(
        true,
      );
    });

    it("NO redirige desde /admin/billing (evita loop)", () => {
      expect(shouldRedirectToBilling("EXPIRED", "/admin/billing")).toBe(false);
    });

    it("NO redirige desde /admin/billing/checkout", () => {
      expect(
        shouldRedirectToBilling("EXPIRED", "/admin/billing/checkout"),
      ).toBe(false);
    });

    it("NO redirige desde superficie atleta", () => {
      expect(shouldRedirectToBilling("EXPIRED", "/atleta")).toBe(false);
      expect(shouldRedirectToBilling("EXPIRED", "/atleta/wod")).toBe(false);
    });

    it("NO redirige desde /api/* (server-side endpoints siguen vivos)", () => {
      expect(shouldRedirectToBilling("EXPIRED", "/api/auth/session")).toBe(
        false,
      );
    });
  });

  describe("non-blocking statuses", () => {
    it.each(["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED"] as const)(
      "%s NO redirige desde /admin",
      (status) => {
        expect(shouldRedirectToBilling(status, "/admin")).toBe(false);
        expect(shouldRedirectToBilling(status, "/admin/atletas")).toBe(false);
      },
    );
  });

  describe("missing status (legacy/null)", () => {
    it("null no redirige (fallback safe)", () => {
      expect(shouldRedirectToBilling(null, "/admin")).toBe(false);
    });

    it("undefined no redirige", () => {
      expect(shouldRedirectToBilling(undefined, "/admin")).toBe(false);
    });
  });
});
