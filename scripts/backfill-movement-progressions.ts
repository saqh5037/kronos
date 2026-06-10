/**
 * One-off backfill: re-seed standard movements for every box so the
 * progressions added to MOVEMENT_ENRICHMENTS (8 catalog skills) land in
 * existing tenants. Idempotent — upserts by (tenantId, slug) and only
 * touches isStandard movements.
 *
 * Usage: pnpm tsx scripts/backfill-movement-progressions.ts
 */

import { PrismaClient } from "@prisma/client";
import { seedStandardMovements } from "../prisma/seed-movements";

async function main() {
  const prisma = new PrismaClient();
  try {
    const boxes = await prisma.box.findMany({
      select: { id: true, name: true, slug: true },
    });
    console.log(`Backfilling standard movements for ${boxes.length} boxes...`);
    for (const box of boxes) {
      console.log(`→ ${box.name} (${box.slug})`);
      await seedStandardMovements(box.id);
    }
    console.log("✅ Backfill complete");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
