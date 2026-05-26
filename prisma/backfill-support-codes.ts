/**
 * Backfill script: assigns a unique support code to every Box that has none.
 *
 * Idempotent: boxes with an existing supportCode are skipped.
 *
 * Usage:
 *   pnpm tsx prisma/backfill-support-codes.ts
 */

import { PrismaClient } from "@prisma/client";
import { generateUniqueSupportCode } from "../src/lib/support-code";

const prisma = new PrismaClient();

async function main() {
  const boxes = await prisma.box.findMany({
    where: { supportCode: null },
    select: { id: true, name: true, slug: true },
  });

  console.log(`Found ${boxes.length} box(es) without support code.`);
  if (boxes.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  let assigned = 0;
  let skipped = 0;

  for (const box of boxes) {
    try {
      const code = await generateUniqueSupportCode(prisma);
      await prisma.box.update({
        where: { id: box.id },
        data: { supportCode: code },
      });
      console.log(`  ✓ ${box.slug} (${box.name}) → ${code}`);
      assigned++;
    } catch (err) {
      console.error(`  ✗ ${box.slug} failed:`, err);
      skipped++;
    }
  }

  console.log(
    `\nDone. Assigned: ${assigned}, Failed: ${skipped}, Already had code: ${boxes.length - assigned - skipped === 0 ? "(all processed)" : "n/a"}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
