import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  rateLimit,
  rateLimitCheck,
  rateLimitHit,
  getClientIp,
  __resetRateLimitForTests,
} from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("permite hasta `limit` requests dentro de la ventana", () => {
    for (let i = 0; i < 5; i++) {
      const r = rateLimit("ip:1.2.3.4", 5, 60_000);
      expect(r.ok).toBe(true);
      expect(r.remaining).toBe(5 - i - 1);
    }
  });

  it("bloquea al request #limit+1 y devuelve retryAfterSec realista", () => {
    for (let i = 0; i < 5; i++) rateLimit("ip:1.2.3.4", 5, 60_000);
    const blocked = rateLimit("ip:1.2.3.4", 5, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(blocked.retryAfterSec).toBeLessThanOrEqual(60);
  });

  it("vuelve a permitir cuando los timestamps salen de la ventana", () => {
    for (let i = 0; i < 5; i++) rateLimit("ip:1.2.3.4", 5, 60_000);
    expect(rateLimit("ip:1.2.3.4", 5, 60_000).ok).toBe(false);

    vi.advanceTimersByTime(61_000);

    expect(rateLimit("ip:1.2.3.4", 5, 60_000).ok).toBe(true);
  });

  it("aisla buckets por key (IP A no afecta IP B)", () => {
    for (let i = 0; i < 5; i++) rateLimit("ip:1.1.1.1", 5, 60_000);
    expect(rateLimit("ip:1.1.1.1", 5, 60_000).ok).toBe(false);
    expect(rateLimit("ip:2.2.2.2", 5, 60_000).ok).toBe(true);
  });
});

describe("rateLimitCheck (read-only) + rateLimitHit (incrementa)", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rateLimitCheck NO incrementa el bucket — múltiples checks consecutivos siguen ok", () => {
    for (let i = 0; i < 20; i++) {
      const r = rateLimitCheck("k:1", 5, 60_000);
      expect(r.ok).toBe(true);
      expect(r.remaining).toBe(5);
    }
  });

  it("rateLimitHit incrementa y rateLimitCheck refleja el cambio", () => {
    rateLimitHit("k:1", 60_000);
    const r1 = rateLimitCheck("k:1", 5, 60_000);
    expect(r1.remaining).toBe(4);
    rateLimitHit("k:1", 60_000);
    const r2 = rateLimitCheck("k:1", 5, 60_000);
    expect(r2.remaining).toBe(3);
  });

  it("patrón 'solo penalizar fallos': N éxitos no consumen cap, M fallos sí", () => {
    // Simula: 100 logins exitosos (no incrementan) + 5 fallos (incrementan)
    for (let i = 0; i < 100; i++) {
      const r = rateLimitCheck("k:1", 5, 60_000);
      expect(r.ok).toBe(true);
      // éxito → no llamamos a hit
    }
    // Ahora 5 fallos
    for (let i = 0; i < 5; i++) {
      expect(rateLimitCheck("k:1", 5, 60_000).ok).toBe(true);
      rateLimitHit("k:1", 60_000);
    }
    // Sexto debería bloquear
    expect(rateLimitCheck("k:1", 5, 60_000).ok).toBe(false);
  });

  it("rateLimitCheck con bucket lleno devuelve retryAfterSec realista", () => {
    for (let i = 0; i < 5; i++) rateLimitHit("k:1", 60_000);
    const r = rateLimitCheck("k:1", 5, 60_000);
    expect(r.ok).toBe(false);
    expect(r.retryAfterSec).toBeGreaterThan(0);
    expect(r.retryAfterSec).toBeLessThanOrEqual(60);
  });
});

describe("getClientIp", () => {
  it("extrae primer IP de x-forwarded-for", () => {
    const h = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" });
    expect(getClientIp(h)).toBe("1.2.3.4");
  });

  it("cae a x-real-ip si no hay forwarded-for", () => {
    const h = new Headers({ "x-real-ip": "5.6.7.8" });
    expect(getClientIp(h)).toBe("5.6.7.8");
  });

  it("devuelve 'unknown' si no hay nada", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
