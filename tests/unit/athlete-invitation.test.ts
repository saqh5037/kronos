import { describe, it, expect } from "vitest";
import {
  parseBulkInvitations,
  isInvitationExpired,
  isInvitationActionable,
  INVITATION_DEFAULT_TTL_DAYS,
} from "@/lib/athlete-invitation";
import { buildInvitationToken } from "@/server/invitation-token";

describe("parseBulkInvitations", () => {
  it("parsea una línea simple con email solamente", () => {
    const out = parseBulkInvitations("alice@example.com");
    expect(out.valid).toEqual([
      {
        email: "alice@example.com",
        firstName: null,
        lastName: null,
        phone: null,
      },
    ]);
    expect(out.errors).toEqual([]);
  });

  it("normaliza email a minúsculas y trimea", () => {
    const out = parseBulkInvitations("  Alice@Example.COM  ");
    expect(out.valid[0]?.email).toBe("alice@example.com");
  });

  it("acepta formato 'email,nombre apellido,phone'", () => {
    const out = parseBulkInvitations(
      "alice@example.com,Alice Liddell,555-1234",
    );
    expect(out.valid[0]).toEqual({
      email: "alice@example.com",
      firstName: "Alice",
      lastName: "Liddell",
      phone: "555-1234",
    });
  });

  it("acepta tab-separated", () => {
    const out = parseBulkInvitations(
      "alice@example.com\tAlice Liddell\t555-1234",
    );
    expect(out.valid[0]?.firstName).toBe("Alice");
    expect(out.valid[0]?.lastName).toBe("Liddell");
  });

  it("nombre con un solo token va a firstName, lastName null", () => {
    const out = parseBulkInvitations("alice@example.com,Alice");
    expect(out.valid[0]?.firstName).toBe("Alice");
    expect(out.valid[0]?.lastName).toBe(null);
  });

  it("nombre con múltiples palabras: primero firstName, resto lastName", () => {
    const out = parseBulkInvitations("alice@example.com,Alice Liddell Smith");
    expect(out.valid[0]?.firstName).toBe("Alice");
    expect(out.valid[0]?.lastName).toBe("Liddell Smith");
  });

  it("ignora líneas vacías y comentarios con #", () => {
    const out = parseBulkInvitations(`
alice@example.com
# comentario
bob@example.com

charlie@example.com
`);
    expect(out.valid.map((v) => v.email)).toEqual([
      "alice@example.com",
      "bob@example.com",
      "charlie@example.com",
    ]);
  });

  it("dedupea emails repetidos quedándose con la primera ocurrencia", () => {
    const out = parseBulkInvitations(`
alice@example.com,Alice Primera
bob@example.com
alice@example.com,Alice Segunda
`);
    expect(out.valid).toHaveLength(2);
    expect(out.valid[0]?.firstName).toBe("Alice");
    expect(out.valid[0]?.lastName).toBe("Primera");
    expect(out.duplicates).toEqual(["alice@example.com"]);
  });

  it("colecciona errores para emails inválidos sin abortar el batch", () => {
    const out = parseBulkInvitations(`
alice@example.com
not-an-email
bob@example.com
`);
    expect(out.valid.map((v) => v.email)).toEqual([
      "alice@example.com",
      "bob@example.com",
    ]);
    expect(out.errors).toHaveLength(1);
    expect(out.errors[0]?.line).toBe(3);
    expect(out.errors[0]?.input).toBe("not-an-email");
  });

  it("acepta separador punto y coma también", () => {
    const out = parseBulkInvitations(
      "alice@example.com;Alice Liddell;555-1234",
    );
    expect(out.valid[0]?.firstName).toBe("Alice");
    expect(out.valid[0]?.phone).toBe("555-1234");
  });

  it("retorna estructuras vacías para input vacío", () => {
    const out = parseBulkInvitations("");
    expect(out.valid).toEqual([]);
    expect(out.errors).toEqual([]);
    expect(out.duplicates).toEqual([]);
  });
});

describe("isInvitationExpired", () => {
  const now = new Date("2026-05-06T12:00:00Z");

  it("retorna true cuando expiresAt < now", () => {
    expect(
      isInvitationExpired({ expiresAt: new Date("2026-05-05T12:00:00Z") }, now),
    ).toBe(true);
  });

  it("retorna false cuando expiresAt > now", () => {
    expect(
      isInvitationExpired({ expiresAt: new Date("2026-05-07T12:00:00Z") }, now),
    ).toBe(false);
  });

  it("retorna true en el límite exacto (now == expiresAt)", () => {
    expect(isInvitationExpired({ expiresAt: now }, now)).toBe(true);
  });
});

describe("isInvitationActionable", () => {
  const now = new Date("2026-05-06T12:00:00Z");
  const future = new Date("2026-05-20T12:00:00Z");
  const past = new Date("2026-05-01T12:00:00Z");

  it("actionable: pending, no expirado, no revocado", () => {
    expect(
      isInvitationActionable(
        { expiresAt: future, acceptedAt: null, revokedAt: null },
        now,
      ),
    ).toEqual({ ok: true });
  });

  it("rechaza si ya aceptado", () => {
    expect(
      isInvitationActionable(
        { expiresAt: future, acceptedAt: now, revokedAt: null },
        now,
      ),
    ).toEqual({ ok: false, reason: "ACCEPTED" });
  });

  it("rechaza si revocado", () => {
    expect(
      isInvitationActionable(
        { expiresAt: future, acceptedAt: null, revokedAt: now },
        now,
      ),
    ).toEqual({ ok: false, reason: "REVOKED" });
  });

  it("rechaza si expirado", () => {
    expect(
      isInvitationActionable(
        { expiresAt: past, acceptedAt: null, revokedAt: null },
        now,
      ),
    ).toEqual({ ok: false, reason: "EXPIRED" });
  });

  it("prioriza ACCEPTED sobre EXPIRED si ambos aplican", () => {
    expect(
      isInvitationActionable(
        { expiresAt: past, acceptedAt: past, revokedAt: null },
        now,
      ),
    ).toEqual({ ok: false, reason: "ACCEPTED" });
  });
});

describe("buildInvitationToken", () => {
  it("genera tokens distintos en llamadas sucesivas", () => {
    const a = buildInvitationToken();
    const b = buildInvitationToken();
    expect(a).not.toBe(b);
  });

  it("genera tokens hex con largo razonable (>= 32 chars)", () => {
    const token = buildInvitationToken();
    expect(token).toMatch(/^[a-f0-9]+$/);
    expect(token.length).toBeGreaterThanOrEqual(32);
  });
});

describe("INVITATION_DEFAULT_TTL_DAYS", () => {
  it("es 14 días por default", () => {
    expect(INVITATION_DEFAULT_TTL_DAYS).toBe(14);
  });
});
