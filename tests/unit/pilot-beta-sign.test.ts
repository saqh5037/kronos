/**
 * signPilotBeta — rate-limit y contratos de error.
 *
 * Nota: esta action es "use server" y depende de next/headers, @/server/db,
 * @/server/audit y @/lib/pilot-beta-token. Se mockean todas esas capas para
 * poder probar la lógica de rate-limit de forma aislada y rápida.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- mocks declarados antes de los imports que los usan ----

vi.mock("next/headers", () => ({
  headers: vi
    .fn()
    .mockResolvedValue(new Headers({ "x-forwarded-for": "1.2.3.4" })),
}));

vi.mock("@/server/db", () => ({
  db: {
    box: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/server/audit", () => ({
  logAudit: vi.fn(),
}));

vi.mock("@/lib/pilot-beta-token", () => ({
  verifyPilotBetaToken: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
  getClientIp: vi.fn(),
}));

// ---- imports tras mocks ----

import { signPilotBeta } from "@/server/actions/pilot-beta";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyPilotBetaToken } from "@/lib/pilot-beta-token";
import { db } from "@/server/db";
import { logAudit } from "@/server/audit";

const validInput = {
  token: "valid-token-string-with-enough-length",
  fullName: "Samuel Quiroz",
  acceptTerms: true as const,
  website: "",
};

const mockRateLimit = vi.mocked(rateLimit);
const mockGetClientIp = vi.mocked(getClientIp);
const mockVerify = vi.mocked(verifyPilotBetaToken);
const mockBoxFindUnique = vi.mocked(db.box.findUnique);
const mockBoxUpdate = vi.mocked(db.box.update);
const mockLogAudit = vi.mocked(logAudit);

const RL_OK = { ok: true, retryAfterSec: 0, remaining: 4 };
const RL_BLOCKED = { ok: false, retryAfterSec: 847, remaining: 0 };

beforeEach(() => {
  vi.resetAllMocks();

  // Defaults: todo pasa — cada test sobreescribe lo que necesita.
  mockGetClientIp.mockReturnValue("1.2.3.4");
  mockRateLimit.mockReturnValue(RL_OK);
  mockVerify.mockResolvedValue({
    ok: true,
    payload: {
      boxId: "box-abc-123",
      exp: Math.floor(Date.now() / 1000) + 86400,
    },
  });
  // @ts-expect-error — mock parcial de PrismaClient
  mockBoxFindUnique.mockResolvedValue({
    name: "Iron Hands",
    pilotBetaSignedAt: null,
  });
  // @ts-expect-error — mock parcial de PrismaClient
  mockBoxUpdate.mockResolvedValue({});
  mockLogAudit.mockResolvedValue(undefined);
});

describe("signPilotBeta — rate-limit por IP", () => {
  it("bloquea cuando rlIp.ok = false (agotó 5 intentos / 15 min)", async () => {
    // Primera llamada (IP rate-limit) bloqueada; segunda (boxId) nunca se alcanza.
    mockRateLimit.mockReturnValueOnce(RL_BLOCKED);

    const result = await signPilotBeta(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("INTERNAL");
      expect(result.message).toMatch(/847s/);
    }
  });

  it("no toca DB cuando la IP está bloqueada", async () => {
    mockRateLimit.mockReturnValueOnce(RL_BLOCKED);

    await signPilotBeta(validInput);

    expect(mockBoxFindUnique).not.toHaveBeenCalled();
    expect(mockBoxUpdate).not.toHaveBeenCalled();
  });
});

describe("signPilotBeta — rate-limit por boxId", () => {
  it("bloquea cuando rlBox.ok = false (rotación de IPs contra mismo box)", async () => {
    // Primera llamada (IP) ok, segunda (boxId) bloqueada.
    mockRateLimit.mockReturnValueOnce(RL_OK).mockReturnValueOnce(RL_BLOCKED);

    const result = await signPilotBeta(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("INTERNAL");
      expect(result.message).toMatch(/847s/);
    }
  });

  it("no toca DB cuando el box está bloqueado", async () => {
    mockRateLimit.mockReturnValueOnce(RL_OK).mockReturnValueOnce(RL_BLOCKED);

    await signPilotBeta(validInput);

    expect(mockBoxFindUnique).not.toHaveBeenCalled();
    expect(mockBoxUpdate).not.toHaveBeenCalled();
  });
});

describe("signPilotBeta — happy path (sin bloqueos)", () => {
  it("retorna ok=true con boxName y signedAt cuando todo pasa", async () => {
    const result = await signPilotBeta(validInput);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.boxName).toBe("Iron Hands");
      expect(result.signedAt).toBeInstanceOf(Date);
    }
  });

  it("llama rateLimit dos veces (una por IP, una por boxId)", async () => {
    await signPilotBeta(validInput);
    expect(mockRateLimit).toHaveBeenCalledTimes(2);
  });
});
