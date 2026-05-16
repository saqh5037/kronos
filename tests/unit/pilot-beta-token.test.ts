/**
 * pilot-beta-token — sign + verify de tokens HMAC para magic link
 * de firma de contrato piloto-beta.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  signPilotBetaToken,
  verifyPilotBetaToken,
} from "@/lib/pilot-beta-token";

const ORIGINAL_SECRET = process.env.PILOT_BETA_TOKEN_SECRET;
const TEST_SECRET = "test-secret-pilot-beta-min-16-chars";

describe("pilot-beta-token", () => {
  beforeEach(() => {
    process.env.PILOT_BETA_TOKEN_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    if (ORIGINAL_SECRET === undefined) {
      delete process.env.PILOT_BETA_TOKEN_SECRET;
    } else {
      process.env.PILOT_BETA_TOKEN_SECRET = ORIGINAL_SECRET;
    }
  });

  describe("signPilotBetaToken", () => {
    it("retorna token formato base64.hex con boxId + expiry encodeados", () => {
      const token = signPilotBetaToken({
        boxId: "box_abc",
        expiresInSec: 3600,
      });
      expect(token).toMatch(/^[A-Za-z0-9_-]+\.[a-f0-9]+$/);
    });

    it("throw si PILOT_BETA_TOKEN_SECRET no configurado", () => {
      delete process.env.PILOT_BETA_TOKEN_SECRET;
      expect(() =>
        signPilotBetaToken({ boxId: "box_abc", expiresInSec: 3600 }),
      ).toThrow(/PILOT_BETA_TOKEN_SECRET/);
    });

    it("throw si secret < 16 chars", () => {
      process.env.PILOT_BETA_TOKEN_SECRET = "short";
      expect(() =>
        signPilotBetaToken({ boxId: "box_abc", expiresInSec: 3600 }),
      ).toThrow(/PILOT_BETA_TOKEN_SECRET/);
    });
  });

  describe("verifyPilotBetaToken", () => {
    it("acepta token válido + retorna payload", () => {
      const token = signPilotBetaToken({
        boxId: "box_xyz",
        expiresInSec: 3600,
      });
      const result = verifyPilotBetaToken(token);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.payload.boxId).toBe("box_xyz");
        expect(result.payload.exp).toBeGreaterThan(
          Math.floor(Date.now() / 1000),
        );
      }
    });

    it("rechaza token expirado", () => {
      // Firmar con expiry en el pasado: now = hace 7200s, expiresInSec = 3600s
      // → exp ≈ ahora - 3600s
      const pastNow = new Date(Date.now() - 7200 * 1000);
      const token = signPilotBetaToken({
        boxId: "box_old",
        expiresInSec: 3600,
        now: pastNow,
      });
      const result = verifyPilotBetaToken(token);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("EXPIRED");
    });

    it("rechaza firma inválida (token tampered)", () => {
      const token = signPilotBetaToken({
        boxId: "box_abc",
        expiresInSec: 3600,
      });
      // Modificar el payload sin re-firmar
      const [encoded, sig] = token.split(".");
      const tampered =
        encoded.slice(0, -1) + (encoded.endsWith("A") ? "B" : "A") + "." + sig;
      const result = verifyPilotBetaToken(tampered);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("INVALID_SIGNATURE");
    });

    it("rechaza formato malo (sin punto separador)", () => {
      const result = verifyPilotBetaToken("not-a-valid-token");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("INVALID_FORMAT");
    });

    it("rechaza formato malo (3 partes)", () => {
      const result = verifyPilotBetaToken("a.b.c");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("INVALID_FORMAT");
    });

    it("rechaza si secret falta (MISSING_SECRET, no leak de info)", () => {
      const token = signPilotBetaToken({
        boxId: "box_abc",
        expiresInSec: 3600,
      });
      delete process.env.PILOT_BETA_TOKEN_SECRET;
      const result = verifyPilotBetaToken(token);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("MISSING_SECRET");
    });

    it("rechaza firma de otro secret (cross-tenant defense)", () => {
      const token = signPilotBetaToken({
        boxId: "box_abc",
        expiresInSec: 3600,
      });
      process.env.PILOT_BETA_TOKEN_SECRET = "different-secret-must-be-16chars";
      const result = verifyPilotBetaToken(token);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("INVALID_SIGNATURE");
    });
  });
});
