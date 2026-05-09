import { describe, it, expect, vi } from "vitest";
import { validateMagicLinkSignIn } from "@/server/auth-signin";

describe("validateMagicLinkSignIn", () => {
  it("allow: provider distinto de email pasa derecho (Google, dev, etc)", async () => {
    const lookup = vi.fn();
    const out = await validateMagicLinkSignIn(
      "google",
      "test@example.com",
      lookup,
    );
    expect(out).toEqual({ type: "allow" });
    expect(lookup).not.toHaveBeenCalled();
  });

  it("allow: email con User+tenantId existente", async () => {
    const lookup = vi.fn().mockResolvedValue({ tenantId: "box-123" });
    const out = await validateMagicLinkSignIn("email", "owner@box.com", lookup);
    expect(out).toEqual({ type: "allow" });
    expect(lookup).toHaveBeenCalledWith("owner@box.com");
  });

  it("redirect: email sin User en DB", async () => {
    const lookup = vi.fn().mockResolvedValue(null);
    const out = await validateMagicLinkSignIn(
      "email",
      "newcomer@example.com",
      lookup,
    );
    expect(out).toEqual({
      type: "redirect",
      url: "/signup?email=newcomer%40example.com&reason=no_account",
    });
  });

  it("redirect: User existe pero sin tenantId (estado inválido)", async () => {
    const lookup = vi.fn().mockResolvedValue({ tenantId: "" });
    const out = await validateMagicLinkSignIn(
      "email",
      "orphan@example.com",
      lookup,
    );
    expect(out.type).toBe("redirect");
    if (out.type === "redirect") {
      expect(out.url).toContain("orphan%40example.com");
      expect(out.url).toContain("reason=no_account");
    }
  });

  it("deny: provider email sin email en payload", async () => {
    const lookup = vi.fn();
    const out = await validateMagicLinkSignIn("email", null, lookup);
    expect(out).toEqual({ type: "deny" });
    expect(lookup).not.toHaveBeenCalled();
  });

  it("normaliza email: trim + lowercase antes de lookup", async () => {
    const lookup = vi.fn().mockResolvedValue({ tenantId: "box-1" });
    await validateMagicLinkSignIn("email", "  Owner@Box.COM  ", lookup);
    expect(lookup).toHaveBeenCalledWith("owner@box.com");
  });

  it("redirect URL: codifica caracteres especiales en email", async () => {
    const lookup = vi.fn().mockResolvedValue(null);
    const out = await validateMagicLinkSignIn(
      "email",
      "user+promo@example.com",
      lookup,
    );
    if (out.type !== "redirect") throw new Error("expected redirect");
    expect(out.url).toContain("user%2Bpromo%40example.com");
  });
});
