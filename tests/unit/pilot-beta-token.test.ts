/**
 * pilot-beta-token — sign, verify y revoke.
 *
 * verifyPilotBetaToken es async desde la adición de jti + revocation check.
 * Se mockea @/server/db para aislar la lógica de la base de datos.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock se hoistea al tope — las variables declaradas fuera del factory
// no están disponibles dentro de él, por eso se usan vi.fn() inline.
vi.mock("@/server/db", () => ({
  db: {
    revokedPilotBetaJti: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// ---- imports tras mocks ----

import {
  signPilotBetaToken,
  verifyPilotBetaToken,
  revokePilotBetaToken,
} from "@/lib/pilot-beta-token";
import { db } from "@/server/db";

// Helpers tipados para acceder a los mocks
const mockFindUnique = vi.mocked(db.revokedPilotBetaJti.findUnique);
const mockCreate = vi.mocked(db.revokedPilotBetaJti.create);

const TEST_SECRET = "test-secret-pilot-beta-min-16-chars";

beforeEach(() => {
  vi.resetAllMocks();
  process.env.PILOT_BETA_TOKEN_SECRET = TEST_SECRET;
  // Por defecto: ningún jti está revocado.
  mockFindUnique.mockResolvedValue(null);
});

// ─── sign ──────────────────────────────────────────────────────────────────

describe("signPilotBetaToken", () => {
  it("retorna token formato base64.hex con boxId + expiry encodeados", () => {
    const token = signPilotBetaToken({ boxId: "box_abc", expiresInSec: 3600 });
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[a-f0-9]+$/);
  });

  it("genera token con jti UUID v4", () => {
    const token = signPilotBetaToken({ boxId: "box_abc", expiresInSec: 3600 });

    const [encoded] = token.split(".");
    const decoded = JSON.parse(
      Buffer.from(
        (encoded ?? "").replace(/-/g, "+").replace(/_/g, "/"),
        "base64",
      ).toString("utf8"),
    );

    expect(decoded.jti).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(decoded.boxId).toBe("box_abc");
  });

  it("lanza error si PILOT_BETA_TOKEN_SECRET no configurado", () => {
    delete process.env.PILOT_BETA_TOKEN_SECRET;
    expect(() =>
      signPilotBetaToken({ boxId: "box_abc", expiresInSec: 3600 }),
    ).toThrow(/PILOT_BETA_TOKEN_SECRET/);
  });

  it("lanza error si secret < 16 chars", () => {
    process.env.PILOT_BETA_TOKEN_SECRET = "short";
    expect(() =>
      signPilotBetaToken({ boxId: "box_abc", expiresInSec: 3600 }),
    ).toThrow(/PILOT_BETA_TOKEN_SECRET/);
  });
});

// ─── verify — token válido ───────────────────────────────────────────────────

describe("verifyPilotBetaToken — token válido no revocado", () => {
  it("acepta token válido y retorna ok=true con payload", async () => {
    const token = signPilotBetaToken({ boxId: "box_xyz", expiresInSec: 3600 });
    const result = await verifyPilotBetaToken(token);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.boxId).toBe("box_xyz");
      expect(result.payload.jti).toBeDefined();
      expect(result.payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    }
  });

  it("consulta la tabla de revocados con el jti del token", async () => {
    const token = signPilotBetaToken({ boxId: "box_xyz", expiresInSec: 3600 });
    const [encoded] = token.split(".");
    const decoded = JSON.parse(
      Buffer.from(
        (encoded ?? "").replace(/-/g, "+").replace(/_/g, "/"),
        "base64",
      ).toString("utf8"),
    );

    await verifyPilotBetaToken(token);

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { jti: decoded.jti },
    });
  });
});

// ─── verify — token revocado ────────────────────────────────────────────────

describe("verifyPilotBetaToken — token con jti revocado", () => {
  it("rechaza token cuyo jti está en la tabla → reason REVOKED", async () => {
    mockFindUnique.mockResolvedValue({
      jti: "some-jti",
      boxId: "box_abc",
      revokedAt: new Date(),
      reason: "leaked",
    });

    const token = signPilotBetaToken({ boxId: "box_abc", expiresInSec: 3600 });
    const result = await verifyPilotBetaToken(token);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("REVOKED");
  });
});

// ─── verify — token legacy sin jti ──────────────────────────────────────────

describe("verifyPilotBetaToken — token legacy sin jti", () => {
  it("acepta token sin jti y omite chequeo de revocación", async () => {
    const { createHmac } = await import("node:crypto");
    const payload = {
      boxId: "box_legacy",
      exp: Math.floor(Date.now() / 1000) + 3600,
      // Sin campo jti — simula token emitido antes de esta versión
    };
    const encoded = Buffer.from(JSON.stringify(payload), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const sig = createHmac("sha256", TEST_SECRET).update(encoded).digest("hex");
    const token = `${encoded}.${sig}`;

    const result = await verifyPilotBetaToken(token);

    expect(result.ok).toBe(true);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});

// ─── verify — errores estructurales ─────────────────────────────────────────

describe("verifyPilotBetaToken — errores de validación", () => {
  it("rechaza token expirado → reason EXPIRED", async () => {
    const pastNow = new Date(Date.now() - 7200 * 1000);
    const token = signPilotBetaToken({
      boxId: "box_old",
      expiresInSec: 3600,
      now: pastNow,
    });
    const result = await verifyPilotBetaToken(token);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("EXPIRED");
  });

  it("rechaza firma inválida (token tampered) → reason INVALID_SIGNATURE", async () => {
    const token = signPilotBetaToken({ boxId: "box_abc", expiresInSec: 3600 });
    const [encoded, sig] = token.split(".");
    const tampered =
      (encoded?.slice(0, -1) ?? "") +
      (encoded?.endsWith("A") ? "B" : "A") +
      "." +
      sig;
    const result = await verifyPilotBetaToken(tampered);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("INVALID_SIGNATURE");
  });

  it("rechaza formato malo (sin punto separador) → reason INVALID_FORMAT", async () => {
    const result = await verifyPilotBetaToken("not-a-valid-token");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("INVALID_FORMAT");
  });

  it("rechaza formato malo (3 partes) → reason INVALID_FORMAT", async () => {
    const result = await verifyPilotBetaToken("a.b.c");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("INVALID_FORMAT");
  });

  it("retorna MISSING_SECRET si env var no está configurado", async () => {
    delete process.env.PILOT_BETA_TOKEN_SECRET;
    const result = await verifyPilotBetaToken("anything.goes");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("MISSING_SECRET");
  });

  it("rechaza token firmado con secret distinto → reason INVALID_SIGNATURE", async () => {
    const token = signPilotBetaToken({ boxId: "box_abc", expiresInSec: 3600 });
    process.env.PILOT_BETA_TOKEN_SECRET = "different-secret-must-be-16chars";
    const result = await verifyPilotBetaToken(token);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("INVALID_SIGNATURE");
  });
});

// ─── revoke ──────────────────────────────────────────────────────────────────

describe("revokePilotBetaToken", () => {
  it("crea row en RevokedPilotBetaJti con los datos correctos", async () => {
    // @ts-expect-error — mock parcial, solo verificamos que create fue llamado
    mockCreate.mockResolvedValue({});

    await revokePilotBetaToken("jti-uuid-123", "box-abc", "leaked");

    expect(mockCreate).toHaveBeenCalledWith({
      data: { jti: "jti-uuid-123", boxId: "box-abc", reason: "leaked" },
    });
  });

  it("funciona sin reason (campo opcional)", async () => {
    // @ts-expect-error — mock parcial
    mockCreate.mockResolvedValue({});

    await revokePilotBetaToken("jti-uuid-456", "box-xyz");

    expect(mockCreate).toHaveBeenCalledWith({
      data: { jti: "jti-uuid-456", boxId: "box-xyz", reason: undefined },
    });
  });
});
