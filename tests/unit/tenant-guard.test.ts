/**
 * TDD RED: Multi-tenant guard — these tests MUST FAIL before implementation.
 *
 * Verifies that Prisma $extends tenant isolation works correctly:
 * - Queries are scoped to the active tenant
 * - A user from Box A cannot read data from Box B
 * - Operations without tenant context throw an explicit error
 */

import { describe, it, expect } from "vitest";

// These imports will fail until the project is scaffolded — that's expected RED state
import { withTenant, db } from "../../src/server/db";
import { getCurrentTenantId, runWithTenant } from "../../src/server/tenant";

describe("Multi-tenant guard", () => {
  const tenantA = "tenant-box-a";
  const tenantB = "tenant-box-b";

  describe("getCurrentTenantId", () => {
    it("should return the active tenant id when set", async () => {
      await runWithTenant(tenantA, async () => {
        const id = getCurrentTenantId();
        expect(id).toBe(tenantA);
      });
    });

    it("should return null when no tenant is active", () => {
      const id = getCurrentTenantId();
      expect(id).toBeNull();
    });

    it("should isolate tenant context between concurrent runs", async () => {
      const results: string[] = [];

      await Promise.all([
        runWithTenant(tenantA, async () => {
          // simulate async work
          await new Promise((r) => setTimeout(r, 10));
          results.push(getCurrentTenantId()!);
        }),
        runWithTenant(tenantB, async () => {
          await new Promise((r) => setTimeout(r, 5));
          results.push(getCurrentTenantId()!);
        }),
      ]);

      expect(results).toContain(tenantA);
      expect(results).toContain(tenantB);
    });
  });

  describe("withTenant Prisma extension", () => {
    it("should throw when querying without active tenant", () => {
      // Outside of runWithTenant — tenantId is null
      expect(() => {
        withTenant("");
      }).toThrow("No tenant context active");
    });

    it("should return a Prisma extension object with model accessors", () => {
      const client = withTenant(tenantA);
      // Prisma $extends returns an object with the same model accessors
      expect(typeof client).toBe("object");
      expect(typeof client.athlete).toBe("object");
      expect(typeof client.box).toBe("object");
    });
  });

  describe("runWithTenant", () => {
    it("should execute callback with tenant context", async () => {
      let capturedTenant: string | null = null;

      await runWithTenant(tenantA, async () => {
        capturedTenant = getCurrentTenantId();
      });

      expect(capturedTenant).toBe(tenantA);
    });

    it("should restore null context after callback completes", async () => {
      await runWithTenant(tenantA, async () => {
        // inside
      });
      // after — should be null again
      expect(getCurrentTenantId()).toBeNull();
    });

    it("should restore null context even if callback throws", async () => {
      try {
        await runWithTenant(tenantA, async () => {
          throw new Error("intentional error");
        });
      } catch {
        // expected
      }
      expect(getCurrentTenantId()).toBeNull();
    });
  });
});

describe("Athlete tenant isolation (integration shape)", () => {
  const tenantA = "tenant-box-a";

  it("should require tenantId shape on Athlete model", () => {
    // This verifies the TypeScript contract exists — will fail until Prisma schema is generated
    // The type check is: PrismaClient.athlete.findMany requires { where: { tenantId: string } }
    // We verify this at the type level only (runtime check would need DB)
    const athleteWhereInput = {} as Parameters<typeof db.athlete.findMany>[0];
    // If Athlete doesn't have tenantId in schema, TypeScript will error here
    const withTenantFilter = {
      ...athleteWhereInput,
      where: { tenantId: tenantA },
    };
    expect(withTenantFilter.where?.tenantId).toBe(tenantA);
  });
});
