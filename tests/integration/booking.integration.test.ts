/**
 * Integration tests for booking flow — exercises Prisma + decideBooking
 * end-to-end against a real Postgres. Skips when DB is unreachable.
 *
 * NOTE: server actions wrap getServerSession; we test the underlying
 * Prisma + helper logic directly to avoid mocking next-auth.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  isDbAvailable,
  getTestClient,
  disconnectTestClient,
  wipeTenant,
  freshTenantId,
} from "./setup";
import { decideBooking, nextWaitlistPromotion } from "../../src/lib/booking";

describe.skipIf(!process.env.DATABASE_URL)("Booking integration", () => {
  const tenantId = freshTenantId();
  const client = getTestClient();
  let available = false;

  beforeAll(async () => {
    available = await isDbAvailable();
    if (!available) return;

    await client.box.create({
      data: { id: tenantId, slug: tenantId, name: "Test Box" },
    });
  });

  afterAll(async () => {
    if (available) await wipeTenant(client, tenantId);
    await disconnectTestClient();
  });

  beforeEach(async () => {
    if (!available) return;
    // Wipe per-test data but keep box + athletes
    await client.score.deleteMany({ where: { tenantId } });
    await client.booking.deleteMany({ where: { tenantId } });
    await client.class.deleteMany({ where: { tenantId } });
    await client.athlete.deleteMany({ where: { tenantId } });
  });

  it.skipIf(!process.env.DATABASE_URL)(
    "decideBooking + Prisma persists BOOKED when capacity available",
    async () => {
      if (!available) return;

      const ath = await client.athlete.create({
        data: {
          tenantId,
          firstName: "Ana",
          lastName: "Test",
          status: "ACTIVE",
        },
      });
      const klass = await client.class.create({
        data: {
          tenantId,
          startsAt: new Date(Date.now() + 24 * 3600 * 1000),
          durationMin: 60,
          capacity: 3,
        },
      });

      const decision = decideBooking(
        { isActive: klass.isActive, startsAt: klass.startsAt, capacity: 3 },
        [],
        ath.id,
      );
      expect(decision).toEqual({ status: "BOOKED" });

      await client.booking.create({
        data: {
          tenantId,
          classId: klass.id,
          athleteId: ath.id,
          status: "BOOKED",
        },
      });

      const count = await client.booking.count({
        where: { classId: klass.id, status: "BOOKED" },
      });
      expect(count).toBe(1);
    },
  );

  it.skipIf(!process.env.DATABASE_URL)(
    "waitlist promotion: cancelling BOOKED promotes earliest WAITLIST",
    async () => {
      if (!available) return;

      const klass = await client.class.create({
        data: {
          tenantId,
          startsAt: new Date(Date.now() + 24 * 3600 * 1000),
          capacity: 1,
        },
      });
      const a1 = await client.athlete.create({
        data: { tenantId, firstName: "A", lastName: "One" },
      });
      const a2 = await client.athlete.create({
        data: { tenantId, firstName: "B", lastName: "Two" },
      });
      const a3 = await client.athlete.create({
        data: { tenantId, firstName: "C", lastName: "Three" },
      });

      // First books, second + third end up on waitlist
      const booked = await client.booking.create({
        data: {
          tenantId,
          classId: klass.id,
          athleteId: a1.id,
          status: "BOOKED",
        },
      });
      const wl1 = await client.booking.create({
        data: {
          tenantId,
          classId: klass.id,
          athleteId: a2.id,
          status: "WAITLIST",
          bookedAt: new Date(Date.now() - 2000),
        },
      });
      const wl2 = await client.booking.create({
        data: {
          tenantId,
          classId: klass.id,
          athleteId: a3.id,
          status: "WAITLIST",
          bookedAt: new Date(Date.now() - 1000),
        },
      });

      // Cancel a1 (BOOKED). Then promote earliest WAITLIST.
      await client.booking.update({
        where: { id: booked.id },
        data: { status: "CANCELLED" },
      });

      const ordered = await client.booking.findMany({
        where: { classId: klass.id, id: { not: booked.id } },
        orderBy: { bookedAt: "asc" },
        select: { id: true, status: true },
      });
      const promoteId = nextWaitlistPromotion(ordered);
      expect(promoteId).toBe(wl1.id);

      await client.booking.update({
        where: { id: promoteId! },
        data: { status: "BOOKED" },
      });

      const after = await client.booking.findUnique({
        where: { id: wl1.id },
      });
      expect(after?.status).toBe("BOOKED");

      // wl2 should still be WAITLIST
      const wl2After = await client.booking.findUnique({
        where: { id: wl2.id },
      });
      expect(wl2After?.status).toBe("WAITLIST");
    },
  );

  it.skipIf(!process.env.DATABASE_URL)(
    "unique constraint: same (classId, athleteId) cannot exist twice",
    async () => {
      if (!available) return;
      const klass = await client.class.create({
        data: {
          tenantId,
          startsAt: new Date(Date.now() + 24 * 3600 * 1000),
          capacity: 5,
        },
      });
      const ath = await client.athlete.create({
        data: { tenantId, firstName: "Dup", lastName: "Test" },
      });
      await client.booking.create({
        data: {
          tenantId,
          classId: klass.id,
          athleteId: ath.id,
          status: "BOOKED",
        },
      });

      await expect(
        client.booking.create({
          data: {
            tenantId,
            classId: klass.id,
            athleteId: ath.id,
            status: "BOOKED",
          },
        }),
      ).rejects.toThrow();
    },
  );
});
