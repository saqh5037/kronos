/**
 * resolveMpBackUrlBase — fail-fast resolution of the MercadoPago return URL base.
 *
 * Regression guard: production must NEVER silently fall back to
 * "http://localhost:3000" for MercadoPago callback URLs. A localhost back-url in
 * prod breaks the payment redirect flow silently. In dev/test the localhost
 * fallback is fine.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { resolveMpBackUrlBase } from "@/lib/payments/mp-client";

describe("resolveMpBackUrlBase", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the configured base url when set (trimmed)", () => {
    vi.stubEnv("MP_BACK_URL_BASE", "  https://www.kronos-fit.com  ");
    expect(resolveMpBackUrlBase()).toBe("https://www.kronos-fit.com");
  });

  it("falls back to localhost in non-production when unset", () => {
    vi.stubEnv("MP_BACK_URL_BASE", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(resolveMpBackUrlBase()).toBe("http://localhost:3000");
  });

  it("throws in production when unset (no silent localhost)", () => {
    vi.stubEnv("MP_BACK_URL_BASE", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => resolveMpBackUrlBase()).toThrow(/MP_BACK_URL_BASE/);
  });
});
