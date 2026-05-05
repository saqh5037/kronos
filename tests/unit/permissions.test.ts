/**
 * Unit tests for can() permission helper.
 * Uses vi.mock to avoid hitting the database.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PermissionAction } from "@prisma/client";

// Mock the db module so rawDb.permission.findUnique doesn't hit Postgres
vi.mock("../../src/server/db", () => ({
  db: {
    permission: {
      findUnique: vi.fn(),
    },
  },
  withTenant: vi.fn(),
}));

import { db } from "../../src/server/db";
import { can, clearPermissionCache } from "../../src/server/permissions";
import type { Session } from "next-auth";

const mockFindUnique = vi.mocked(db.permission.findUnique);

function makeSession(role: string, tenantId = "tenant-1"): Session {
  return {
    user: {
      id: "user-1",
      email: "test@test.com",
      role,
      tenantId,
    },
    expires: new Date(Date.now() + 3600000).toISOString(),
  } as unknown as Session;
}

beforeEach(() => {
  vi.clearAllMocks();
  clearPermissionCache();
});

describe("can()", () => {
  const action: PermissionAction = "REGISTER_CASH_PAYMENT";

  it("OWNER siempre allowed sin DB hit", async () => {
    const session = makeSession("OWNER");
    const result = await can(action, session);

    expect(result).toEqual({ allowed: true, requiresApproval: false });
    // Owner bypasses DB entirely
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("COACH allowed cuando su role está en allowedRoles", async () => {
    const session = makeSession("COACH");
    mockFindUnique.mockResolvedValueOnce({
      allowedRoles: ["OWNER", "COACH", "STAFF"],
      requiresOwnerApproval: false,
      threshold: null,
    } as never);

    const result = await can(action, session);

    expect(result).toEqual({ allowed: true, requiresApproval: false });
  });

  it("COACH NOT allowed cuando su role NO está en allowedRoles", async () => {
    const session = makeSession("COACH");
    mockFindUnique.mockResolvedValueOnce({
      allowedRoles: ["OWNER"],
      requiresOwnerApproval: false,
      threshold: null,
    } as never);

    const result = await can(action, session);

    expect(result).toEqual({ allowed: false, requiresApproval: false });
  });

  it("STAFF NOT allowed cuando su role NO está en allowedRoles", async () => {
    const session = makeSession("STAFF");
    mockFindUnique.mockResolvedValueOnce({
      allowedRoles: ["OWNER"],
      requiresOwnerApproval: false,
      threshold: null,
    } as never);

    const result = await can("REFUND_PAYMENT", session);

    expect(result).toEqual({ allowed: false, requiresApproval: false });
  });

  it("requiresApproval=true cuando COACH allowed pero requiresOwnerApproval=true", async () => {
    const session = makeSession("COACH");
    mockFindUnique.mockResolvedValueOnce({
      allowedRoles: ["OWNER", "COACH"],
      requiresOwnerApproval: true,
      threshold: null,
    } as never);

    const result = await can("REFUND_PAYMENT", session);

    expect(result).toEqual({ allowed: true, requiresApproval: true });
  });

  it("denied y requiresApproval=false cuando rol no allowed aunque requiresOwnerApproval=true", async () => {
    const session = makeSession("STAFF");
    mockFindUnique.mockResolvedValueOnce({
      allowedRoles: ["OWNER", "COACH"], // STAFF not included
      requiresOwnerApproval: true,
      threshold: null,
    } as never);

    const result = await can("REFUND_PAYMENT", session);

    // Not allowed, so requiresApproval is irrelevant — return false/false
    expect(result).toEqual({ allowed: false, requiresApproval: false });
  });

  it("denied cuando no existe Permission row (secure default)", async () => {
    const session = makeSession("COACH");
    mockFindUnique.mockResolvedValueOnce(null as never);

    const result = await can(action, session);

    expect(result).toEqual({ allowed: false, requiresApproval: false });
  });

  it("usa el cache en la segunda llamada — solo 1 DB hit", async () => {
    const session = makeSession("COACH");
    mockFindUnique.mockResolvedValue({
      allowedRoles: ["OWNER", "COACH"],
      requiresOwnerApproval: false,
      threshold: null,
    } as never);

    await can(action, session);
    await can(action, session); // second call — should hit cache

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });
});
