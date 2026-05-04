/**
 * mp-client: singleton de MercadoPagoConfig + flag isMpConfigured.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";

const originalToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete (process.env as Record<string, string | undefined>)[key];
  } else {
    (process.env as Record<string, string | undefined>)[key] = value;
  }
}

afterEach(() => {
  setEnv("MERCADOPAGO_ACCESS_TOKEN", originalToken);
});

beforeEach(async () => {
  // Reset module to force re-evaluation of cachedConfig
  const mod = await import("@/lib/payments/mp-client");
  mod.resetMpConfigCache();
});

describe("isMpConfigured", () => {
  it("devuelve false sin env", async () => {
    setEnv("MERCADOPAGO_ACCESS_TOKEN", undefined);
    const { isMpConfigured } = await import("@/lib/payments/mp-client");
    expect(isMpConfigured()).toBe(false);
  });

  it("devuelve true con env presente", async () => {
    setEnv("MERCADOPAGO_ACCESS_TOKEN", "TEST-fake-token");
    const { isMpConfigured } = await import("@/lib/payments/mp-client");
    expect(isMpConfigured()).toBe(true);
  });
});

describe("getMpConfig", () => {
  it("lanza si no hay token", async () => {
    setEnv("MERCADOPAGO_ACCESS_TOKEN", undefined);
    const { getMpConfig, resetMpConfigCache } =
      await import("@/lib/payments/mp-client");
    resetMpConfigCache();
    expect(() => getMpConfig()).toThrow(/MERCADOPAGO_ACCESS_TOKEN/);
  });

  it("devuelve la misma instancia (singleton)", async () => {
    setEnv("MERCADOPAGO_ACCESS_TOKEN", "TEST-fake-token");
    const { getMpConfig, resetMpConfigCache } =
      await import("@/lib/payments/mp-client");
    resetMpConfigCache();
    const a = getMpConfig();
    const b = getMpConfig();
    expect(a).toBe(b);
  });
});
