/**
 * Integration tests for createPilotBox — server action que crea Box piloto
 * desde wizard super-admin (/admin/super/pilotos/nuevo).
 *
 * Ejecuta Prisma real contra Postgres del compose. Mockea:
 *  - next-auth getServerSession → email super-admin válido
 *  - env SUPER_ADMIN_EMAILS via mock de @/lib/super-admin
 *
 * Skip si DATABASE_URL no setea o DB no responde.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { isDbAvailable, getTestClient, disconnectTestClient } from "./setup";

const SUPER_ADMIN_EMAIL = "super@kronos.test";

const { getServerSessionMock, isSuperAdminMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  isSuperAdminMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

// authOptions importa EmailProvider que requiere nodemailer — stub para evitar
// resolver dependencias auth full en integration test.
vi.mock("../../src/server/auth", () => ({
  authOptions: {},
}));

vi.mock("../../src/lib/super-admin", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/lib/super-admin")
  >("../../src/lib/super-admin");
  return {
    ...actual,
    isSuperAdmin: isSuperAdminMock,
  };
});

// Import después de los mocks
import { createPilotBox } from "../../src/server/actions/pilot-onboarding";

const validInput = {
  email: "owner@pilot-box.test",
  ownerName: "Owner Test",
  boxName: "Pilot Box Hyrox",
  slug: `pilot-test-${Date.now()}`,
  disciplineSlug: "hyrox" as const,
  city: "CDMX",
  country: "MX",
  region: "",
  trialDurationDays: 30,
  exclusivityDays: 60,
  enableHyroxUI: false,
  enableMmAthlete: false,
  website: "",
};

describe.skipIf(!process.env.DATABASE_URL)(
  "pilot-onboarding integration",
  () => {
    const client = getTestClient();
    let available = false;
    const createdBoxIds: string[] = [];
    const createdUserEmails: string[] = [];

    beforeAll(async () => {
      available = await isDbAvailable();
      if (!available) return;

      // Asegurar disciplines (idempotente, en caso de DB sin seed)
      await client.discipline.upsert({
        where: { slug: "crossfit" },
        update: {},
        create: {
          slug: "crossfit",
          name: "CrossFit",
          strategy: "crossfit",
          measurements: ["TIME", "REPS", "WEIGHT", "ROUNDS_REPS"],
          isActive: true,
        },
      });
      await client.discipline.upsert({
        where: { slug: "hyrox" },
        update: {},
        create: {
          slug: "hyrox",
          name: "Hyrox",
          strategy: "hyrox",
          measurements: ["TIME", "DISTANCE"],
          isActive: true,
        },
      });

      // Default: simular super-admin autenticado
      getServerSessionMock.mockResolvedValue({
        user: { email: SUPER_ADMIN_EMAIL },
      });
      isSuperAdminMock.mockImplementation(
        (email?: string | null) => email === SUPER_ADMIN_EMAIL,
      );
    });

    afterAll(async () => {
      if (available) {
        // Cleanup: borrar users primero por FK, luego boxes
        for (const email of createdUserEmails) {
          await client.user.deleteMany({ where: { email } }).catch(() => {});
        }
        for (const boxId of createdBoxIds) {
          await client.user
            .deleteMany({ where: { tenantId: boxId } })
            .catch(() => {});
          await client.box.delete({ where: { id: boxId } }).catch(() => {});
        }
      }
      await disconnectTestClient();
      vi.restoreAllMocks();
    });

    it("crea Box + OWNER User con fields correctos (happy path Hyrox)", async () => {
      if (!available) return;
      const slug = `happy-hyrox-${Date.now()}`;
      const email = `${slug}@pilot.test`;

      const result = await createPilotBox({
        ...validInput,
        slug,
        email,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      createdBoxIds.push(result.boxId);
      createdUserEmails.push(email);

      // Verifica Box en DB
      const box = await client.box.findUnique({
        where: { id: result.boxId },
        include: { discipline: true },
      });
      expect(box).toBeDefined();
      expect(box!.slug).toBe(slug);
      expect(box!.subscriptionStatus).toBe("TRIAL");
      expect(box!.trialStartedAt).not.toBeNull();
      expect(box!.trialEndsAt).not.toBeNull();
      expect(box!.country).toBe("MX");
      expect(box!.city).toBe("CDMX");
      expect(box!.discipline?.slug).toBe("hyrox");
      expect(box!.pilotExclusivityExpiresAt).not.toBeNull();
      // Feature hyrox auto-activado por disciplineSlug=hyrox
      expect(box!.features).toMatchObject({ hyrox: true });

      // Verifica trial dura ~30 días (tolerancia 5s)
      const trialMs =
        box!.trialEndsAt!.getTime() - box!.trialStartedAt!.getTime();
      const expectedMs = 30 * 24 * 60 * 60 * 1000;
      expect(Math.abs(trialMs - expectedMs)).toBeLessThan(5000);

      // Verifica User OWNER en DB
      const owner = await client.user.findUnique({ where: { email } });
      expect(owner).toBeDefined();
      expect(owner!.role).toBe("OWNER");
      expect(owner!.tenantId).toBe(result.boxId);
    });

    it("rechaza si caller no es super-admin (UNAUTHORIZED)", async () => {
      if (!available) return;
      getServerSessionMock.mockResolvedValueOnce({
        user: { email: "outsider@kronos.test" },
      });

      const result = await createPilotBox({
        ...validInput,
        slug: `unauth-${Date.now()}`,
        email: `unauth-${Date.now()}@pilot.test`,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe("UNAUTHORIZED");
    });

    it("rechaza slug duplicado (SLUG_TAKEN)", async () => {
      if (!available) return;
      const slug = `dup-slug-${Date.now()}`;

      const first = await createPilotBox({
        ...validInput,
        slug,
        email: `first-${Date.now()}@pilot.test`,
      });
      expect(first.ok).toBe(true);
      if (first.ok) {
        createdBoxIds.push(first.boxId);
        createdUserEmails.push(`first-${Date.now()}@pilot.test`);
      }

      const second = await createPilotBox({
        ...validInput,
        slug,
        email: `second-${Date.now()}@pilot.test`,
      });
      expect(second.ok).toBe(false);
      if (second.ok) return;
      expect(second.error).toBe("SLUG_TAKEN");
    });

    it("rechaza email duplicado (EMAIL_TAKEN)", async () => {
      if (!available) return;
      const email = `dup-email-${Date.now()}@pilot.test`;

      const first = await createPilotBox({
        ...validInput,
        slug: `email-1-${Date.now()}`,
        email,
      });
      expect(first.ok).toBe(true);
      if (first.ok) {
        createdBoxIds.push(first.boxId);
        createdUserEmails.push(email);
      }

      const second = await createPilotBox({
        ...validInput,
        slug: `email-2-${Date.now()}`,
        email,
      });
      expect(second.ok).toBe(false);
      if (second.ok) return;
      expect(second.error).toBe("EMAIL_TAKEN");
    });

    it("rechaza slug reservado (SLUG_RESERVED)", async () => {
      if (!available) return;
      const result = await createPilotBox({
        ...validInput,
        slug: "admin",
        email: `reserved-${Date.now()}@pilot.test`,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe("SLUG_RESERVED");
    });

    it("crea Box CrossFit sin auto-activar feature hyrox", async () => {
      if (!available) return;
      const slug = `crossfit-${Date.now()}`;
      const email = `${slug}@pilot.test`;

      const result = await createPilotBox({
        ...validInput,
        slug,
        email,
        disciplineSlug: "crossfit",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      createdBoxIds.push(result.boxId);
      createdUserEmails.push(email);

      const box = await client.box.findUnique({
        where: { id: result.boxId },
        select: { features: true },
      });
      expect(box!.features).toEqual({});
    });

    it("respeta exclusivityDays=0 (sin exclusividad)", async () => {
      if (!available) return;
      const slug = `no-excl-${Date.now()}`;
      const email = `${slug}@pilot.test`;

      const result = await createPilotBox({
        ...validInput,
        slug,
        email,
        exclusivityDays: 0,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      createdBoxIds.push(result.boxId);
      createdUserEmails.push(email);

      expect(result.pilotExclusivityExpiresAt).toBeNull();
    });
  },
);
