/**
 * Integration tests for score + PR auto-detection.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  isDbAvailable,
  getTestClient,
  disconnectTestClient,
  wipeTenant,
  freshTenantId,
} from "./setup";
import { detectPR } from "../../src/lib/scores";

describe.skipIf(!process.env.DATABASE_URL)("Scores + PR integration", () => {
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
    await client.score.deleteMany({ where: { tenantId } });
    await client.pR.deleteMany({ where: { tenantId } });
    await client.wODMovement.deleteMany({ where: { wod: { tenantId } } });
    await client.wOD.deleteMany({ where: { tenantId } });
    await client.movement.deleteMany({ where: { tenantId } });
    await client.athlete.deleteMany({ where: { tenantId } });
  });

  it.skipIf(!process.env.DATABASE_URL)(
    "creates PR when no previous PR exists for STRENGTH WOD",
    async () => {
      if (!available) return;

      const ath = await client.athlete.create({
        data: { tenantId, firstName: "Test", lastName: "Athlete" },
      });
      const movement = await client.movement.create({
        data: { tenantId, name: "Back Squat" },
      });
      const wod = await client.wOD.create({
        data: {
          tenantId,
          name: "1RM Back Squat",
          type: "STRENGTH",
          scoreType: "WEIGHT",
          movements: { create: { movementId: movement.id, order: 0 } },
        },
      });

      // Submit first score
      const score1 = await client.score.create({
        data: {
          tenantId,
          wodId: wod.id,
          athleteId: ath.id,
          value: 100,
          unit: "kg",
          scaling: "RX",
        },
      });
      expect(Number(score1.value)).toBe(100);

      // Apply detectPR logic
      const existing = await client.pR.findUnique({
        where: {
          athleteId_movementId: { athleteId: ath.id, movementId: movement.id },
        },
      });
      const newPR = detectPR(
        existing ? Number(existing.value) : null,
        100,
        "WEIGHT",
      );
      expect(newPR).toBe(100);

      await client.pR.create({
        data: {
          tenantId,
          athleteId: ath.id,
          movementId: movement.id,
          value: 100,
          unit: "kg",
        },
      });

      const stored = await client.pR.findUnique({
        where: {
          athleteId_movementId: { athleteId: ath.id, movementId: movement.id },
        },
      });
      expect(stored).not.toBeNull();
      expect(Number(stored!.value)).toBe(100);
    },
  );

  it.skipIf(!process.env.DATABASE_URL)(
    "updates PR only when new score is higher",
    async () => {
      if (!available) return;

      const ath = await client.athlete.create({
        data: { tenantId, firstName: "Test", lastName: "Athlete" },
      });
      const movement = await client.movement.create({
        data: { tenantId, name: "Deadlift" },
      });

      await client.pR.create({
        data: {
          tenantId,
          athleteId: ath.id,
          movementId: movement.id,
          value: 150,
          unit: "kg",
        },
      });

      // Lower attempt — should not become new PR
      const lower = detectPR(150, 145, "WEIGHT");
      expect(lower).toBeNull();

      // Equal attempt — also not a PR (tie does not break)
      const tie = detectPR(150, 150, "WEIGHT");
      expect(tie).toBeNull();

      // Higher attempt — IS a PR
      const higher = detectPR(150, 160, "WEIGHT");
      expect(higher).toBe(160);

      await client.pR.upsert({
        where: {
          athleteId_movementId: { athleteId: ath.id, movementId: movement.id },
        },
        update: { value: 160, unit: "kg", achievedAt: new Date() },
        create: {
          tenantId,
          athleteId: ath.id,
          movementId: movement.id,
          value: 160,
          unit: "kg",
        },
      });

      const stored = await client.pR.findUnique({
        where: {
          athleteId_movementId: { athleteId: ath.id, movementId: movement.id },
        },
      });
      expect(Number(stored!.value)).toBe(160);
    },
  );
});
