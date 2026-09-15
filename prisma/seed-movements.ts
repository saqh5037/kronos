import { PrismaClient } from "@prisma/client";
import {
  MOVEMENT_ENRICHMENTS,
  STANDARD_MOVEMENTS,
  type StandardMovement,
} from "./data/movements";

// The catalogue itself lives in `prisma/data/movements.ts` (pure data, no
// Prisma import) so unit tests can assert on it. Re-exported here because
// `prisma/seed.ts` and the movement admin import it from this path.
export { MOVEMENT_ENRICHMENTS, STANDARD_MOVEMENTS };
export type { StandardMovement };

/**
 * Creates/upserts the 50 standard CrossFit movements for a given tenantId.
 * Uses isStandard=true flag. Idempotent — safe to run multiple times.
 *
 * CLI-only wrapper: instantiates a PrismaClient. For server-side use inside
 * transactions (e.g. signup), call seedDefaultMovements() from
 * src/server/seed-defaults.ts with a transaction client.
 */
export async function seedStandardMovements(tenantId: string): Promise<void> {
  const prisma = new PrismaClient();
  try {
    console.log(
      `  Seeding ${STANDARD_MOVEMENTS.length} standard movements for tenant ${tenantId}...`,
    );
    for (const mv of STANDARD_MOVEMENTS) {
      const enrich = MOVEMENT_ENRICHMENTS[mv.slug];
      const enrichmentData: Record<string, unknown> = {};
      let hasContent = false;
      if (enrich) {
        if (enrich.cues) {
          enrichmentData.cues = enrich.cues;
          hasContent = true;
        }
        if (enrich.commonMistakes) {
          enrichmentData.commonMistakes = enrich.commonMistakes;
          hasContent = true;
        }
        if (enrich.progressions) {
          enrichmentData.progressions = enrich.progressions;
          hasContent = true;
        }
        if (enrich.musclesWorked)
          enrichmentData.musclesWorked = enrich.musclesWorked;
        if (enrich.difficulty != null)
          enrichmentData.difficulty = enrich.difficulty;
      }
      if (hasContent) {
        enrichmentData.contentSource = "STANDARD_SEED";
      }
      await prisma.movement.upsert({
        where: { tenantId_slug: { tenantId, slug: mv.slug } },
        update: {
          name: mv.name,
          category: mv.category,
          standardDescription: mv.standardDescription,
          videoUrl: mv.videoUrl,
          equipment: mv.equipment,
          isStandard: true,
          ...enrichmentData,
        },
        create: {
          tenantId,
          slug: mv.slug,
          name: mv.name,
          category: mv.category,
          isStandard: true,
          standardDescription: mv.standardDescription,
          videoUrl: mv.videoUrl,
          equipment: mv.equipment,
          ...enrichmentData,
        },
      });
    }
    console.log(`  ✅ ${STANDARD_MOVEMENTS.length} movimientos seeded`);
  } finally {
    await prisma.$disconnect();
  }
}
