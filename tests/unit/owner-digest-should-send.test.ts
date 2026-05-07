import { describe, it, expect } from "vitest";
import {
  shouldSendOwnerDigest,
  DIGEST_COOLDOWN_DAYS,
} from "@/server/owner-digest/should-send";

const NOW = new Date("2026-05-07T12:00:00Z");
const dayMs = 24 * 60 * 60 * 1000;

describe("shouldSendOwnerDigest", () => {
  it("envía cuando nunca se envió antes (lastSentAt = null)", () => {
    expect(shouldSendOwnerDigest({ lastSentAt: null, now: NOW })).toBe(true);
  });

  it("envía cuando pasaron 7 días desde la última (cooldown 6d)", () => {
    const lastSentAt = new Date(NOW.getTime() - 7 * dayMs);
    expect(shouldSendOwnerDigest({ lastSentAt, now: NOW })).toBe(true);
  });

  it("skip cuando se envió hace 3 días (dentro de cooldown)", () => {
    const lastSentAt = new Date(NOW.getTime() - 3 * dayMs);
    expect(shouldSendOwnerDigest({ lastSentAt, now: NOW })).toBe(false);
  });

  it("envía exactamente al cooldown (lastSentAt + cooldownDays == now)", () => {
    const lastSentAt = new Date(NOW.getTime() - 6 * dayMs);
    expect(shouldSendOwnerDigest({ lastSentAt, now: NOW })).toBe(true);
  });

  it("skip cuando se envió hace menos de 6 días (5d 23h)", () => {
    const lastSentAt = new Date(NOW.getTime() - (6 * dayMs - 60 * 60 * 1000));
    expect(shouldSendOwnerDigest({ lastSentAt, now: NOW })).toBe(false);
  });

  it("respeta cooldown custom (3 días)", () => {
    const lastSentAt = new Date(NOW.getTime() - 4 * dayMs);
    expect(
      shouldSendOwnerDigest({ lastSentAt, now: NOW, cooldownDays: 3 }),
    ).toBe(true);
    expect(
      shouldSendOwnerDigest({ lastSentAt, now: NOW, cooldownDays: 5 }),
    ).toBe(false);
  });

  it("DIGEST_COOLDOWN_DAYS = 6", () => {
    expect(DIGEST_COOLDOWN_DAYS).toBe(6);
  });
});
