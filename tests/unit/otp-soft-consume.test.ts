/**
 * findOtpMatch + markOtpConsumed — soft-consume con ventana de gracia 5 min.
 *
 * El código OTP se mantiene válido los primeros REUSE_GRACE_MS (5 min)
 * después del primer uso, para permitir login cross-browser (Chrome ↔ Safari
 * en iPhone). Este test valida ese contrato.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  verificationTokenFindMany,
  verificationTokenUpdateMany,
  verificationTokenDelete,
} = vi.hoisted(() => ({
  verificationTokenFindMany: vi.fn(),
  verificationTokenUpdateMany: vi.fn(),
  verificationTokenDelete: vi.fn(),
}));

vi.mock("../../src/server/db", () => ({
  db: {
    verificationToken: {
      findMany: verificationTokenFindMany,
      updateMany: verificationTokenUpdateMany,
      delete: verificationTokenDelete,
    },
  },
}));

import {
  findOtpMatch,
  markOtpConsumed,
  deriveOtpFromToken,
  REUSE_GRACE_MS,
} from "../../src/server/otp";

const SECRET = "test-secret-1234567890-abcdefghijklmnop";
const EMAIL = "atleta@example.com";
const TOKEN_RAW = "raw-token-abc-xyz-123";

beforeEach(() => {
  verificationTokenFindMany.mockReset();
  verificationTokenUpdateMany.mockReset();
  verificationTokenDelete.mockReset();
  verificationTokenDelete.mockResolvedValue(undefined);
  verificationTokenUpdateMany.mockResolvedValue({ count: 1 });
});

function makeToken(overrides: {
  expiresOffsetMs?: number;
  consumedAtOffsetMs?: number | null;
}) {
  const now = Date.now();
  return {
    identifier: EMAIL,
    token: TOKEN_RAW,
    expires: new Date(now + (overrides.expiresOffsetMs ?? 60 * 60_000)),
    consumedAt:
      overrides.consumedAtOffsetMs === undefined ||
      overrides.consumedAtOffsetMs === null
        ? null
        : new Date(now + overrides.consumedAtOffsetMs),
  };
}

describe("findOtpMatch — soft-consume + ventana de gracia", () => {
  it("acepta un token nunca consumido (consumedAt = null)", async () => {
    verificationTokenFindMany.mockResolvedValue([
      makeToken({ consumedAtOffsetMs: null }),
    ]);
    const code = deriveOtpFromToken(TOKEN_RAW, SECRET);
    const res = await findOtpMatch(EMAIL, code, SECRET);
    expect(res.ok).toBe(true);
  });

  it("acepta un token consumido hace 2 min (dentro de ventana de gracia)", async () => {
    verificationTokenFindMany.mockResolvedValue([
      makeToken({ consumedAtOffsetMs: -2 * 60_000 }),
    ]);
    const code = deriveOtpFromToken(TOKEN_RAW, SECRET);
    const res = await findOtpMatch(EMAIL, code, SECRET);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.token).toBe(TOKEN_RAW);
      expect(res.identifier).toBe(EMAIL);
    }
  });

  it("rechaza un token consumido hace 6 min (pasada la ventana de gracia) y dispara GC", async () => {
    verificationTokenFindMany.mockResolvedValue([
      makeToken({ consumedAtOffsetMs: -(REUSE_GRACE_MS + 60_000) }),
    ]);
    const code = deriveOtpFromToken(TOKEN_RAW, SECRET);
    const res = await findOtpMatch(EMAIL, code, SECRET);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe("EXPIRED");
    }
    // GC inline: el token pasado-de-gracia debe haberse intentado borrar.
    expect(verificationTokenDelete).toHaveBeenCalledWith({
      where: {
        identifier_token: { identifier: EMAIL, token: TOKEN_RAW },
      },
    });
  });

  it("rechaza un token cuyo expires ya pasó (independiente de consumedAt)", async () => {
    verificationTokenFindMany.mockResolvedValue([
      makeToken({ expiresOffsetMs: -1000, consumedAtOffsetMs: null }),
    ]);
    const code = deriveOtpFromToken(TOKEN_RAW, SECRET);
    const res = await findOtpMatch(EMAIL, code, SECRET);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe("EXPIRED");
    }
  });

  it("devuelve NO_TOKEN cuando no hay candidates para el email", async () => {
    verificationTokenFindMany.mockResolvedValue([]);
    const code = deriveOtpFromToken(TOKEN_RAW, SECRET);
    const res = await findOtpMatch(EMAIL, code, SECRET);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe("NO_TOKEN");
    }
  });

  it("devuelve MISMATCH cuando el código no matchea ningún token activo", async () => {
    verificationTokenFindMany.mockResolvedValue([
      makeToken({ consumedAtOffsetMs: null }),
    ]);
    // Código distinto al derivado.
    const wrongCode = "999999";
    const right = deriveOtpFromToken(TOKEN_RAW, SECRET);
    // Sanity: aseguramos que NO coincida (probabilidad ~10⁻⁶)
    expect(right).not.toBe(wrongCode);
    const res = await findOtpMatch(EMAIL, wrongCode, SECRET);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe("MISMATCH");
    }
  });

  it("normaliza el email a lowercase + trim antes de buscar", async () => {
    verificationTokenFindMany.mockResolvedValue([
      makeToken({ consumedAtOffsetMs: null }),
    ]);
    const code = deriveOtpFromToken(TOKEN_RAW, SECRET);
    await findOtpMatch("  ATLETA@example.com  ", code, SECRET);
    expect(verificationTokenFindMany).toHaveBeenCalledWith({
      where: { identifier: EMAIL },
      orderBy: { expires: "desc" },
    });
  });
});

describe("markOtpConsumed — idempotencia con updateMany guard", () => {
  it("marca consumedAt solo si todavía es null (filtro updateMany)", async () => {
    await markOtpConsumed(EMAIL, TOKEN_RAW);
    expect(verificationTokenUpdateMany).toHaveBeenCalledTimes(1);
    const callArg = verificationTokenUpdateMany.mock.calls[0][0];
    expect(callArg.where).toEqual({
      identifier: EMAIL,
      token: TOKEN_RAW,
      consumedAt: null,
    });
    expect(callArg.data.consumedAt).toBeInstanceOf(Date);
  });

  it("ignora errores silenciosamente (idempotente)", async () => {
    verificationTokenUpdateMany.mockRejectedValue(
      new Error("connection refused"),
    );
    // No debe propagar
    await expect(markOtpConsumed(EMAIL, TOKEN_RAW)).resolves.toBeUndefined();
  });
});
