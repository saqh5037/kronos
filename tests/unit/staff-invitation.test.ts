import { describe, it, expect } from "vitest";
import {
  isInvitationExpired,
  isInvitationActionable,
  buildInvitationExpiry,
  INVITATION_DEFAULT_TTL_DAYS,
  STAFF_INVITATION_ROLES,
} from "@/lib/staff-invitation";

describe("staff-invitation: re-exports from athlete-invitation", () => {
  it("exporta INVITATION_DEFAULT_TTL_DAYS = 14", () => {
    expect(INVITATION_DEFAULT_TTL_DAYS).toBe(14);
  });

  it("exporta isInvitationExpired funcional", () => {
    const now = new Date("2026-05-06T12:00:00Z");
    expect(
      isInvitationExpired({ expiresAt: new Date("2026-05-05T12:00:00Z") }, now),
    ).toBe(true);
    expect(
      isInvitationExpired({ expiresAt: new Date("2026-05-07T12:00:00Z") }, now),
    ).toBe(false);
  });

  it("isInvitationActionable: devuelve ok cuando pending y no expirado", () => {
    const now = new Date("2026-05-06T12:00:00Z");
    const future = new Date("2026-05-20T12:00:00Z");
    expect(
      isInvitationActionable(
        { expiresAt: future, acceptedAt: null, revokedAt: null },
        now,
      ),
    ).toEqual({ ok: true });
  });

  it("isInvitationActionable: rechaza ACCEPTED", () => {
    const now = new Date("2026-05-06T12:00:00Z");
    expect(
      isInvitationActionable(
        {
          expiresAt: new Date("2026-05-20T12:00:00Z"),
          acceptedAt: now,
          revokedAt: null,
        },
        now,
      ),
    ).toEqual({ ok: false, reason: "ACCEPTED" });
  });

  it("isInvitationActionable: rechaza REVOKED", () => {
    const now = new Date("2026-05-06T12:00:00Z");
    expect(
      isInvitationActionable(
        {
          expiresAt: new Date("2026-05-20T12:00:00Z"),
          acceptedAt: null,
          revokedAt: now,
        },
        now,
      ),
    ).toEqual({ ok: false, reason: "REVOKED" });
  });

  it("isInvitationActionable: rechaza EXPIRED", () => {
    const now = new Date("2026-05-06T12:00:00Z");
    const past = new Date("2026-05-01T12:00:00Z");
    expect(
      isInvitationActionable(
        { expiresAt: past, acceptedAt: null, revokedAt: null },
        now,
      ),
    ).toEqual({ ok: false, reason: "EXPIRED" });
  });
});

describe("buildInvitationExpiry", () => {
  it("default es 14 días después de la fecha base", () => {
    const base = new Date("2026-05-06T12:00:00Z");
    const expiry = buildInvitationExpiry(undefined, base);
    const expected = new Date("2026-05-20T12:00:00Z");
    expect(expiry.getTime()).toBe(expected.getTime());
  });

  it("respeta TTL custom", () => {
    const base = new Date("2026-05-06T12:00:00Z");
    const expiry = buildInvitationExpiry(7, base);
    const expected = new Date("2026-05-13T12:00:00Z");
    expect(expiry.getTime()).toBe(expected.getTime());
  });
});

describe("STAFF_INVITATION_ROLES", () => {
  it("contiene COACH y STAFF, en ese orden", () => {
    expect(STAFF_INVITATION_ROLES).toEqual(["COACH", "STAFF"]);
  });

  it("es readonly tuple — no incluye OWNER ni ATHLETE", () => {
    expect(STAFF_INVITATION_ROLES).not.toContain("OWNER");
    expect(STAFF_INVITATION_ROLES).not.toContain("ATHLETE");
  });
});
