import type { Prisma, PrismaClient } from "@prisma/client";
import {
  STANDARD_MOVEMENTS,
  MOVEMENT_ENRICHMENTS,
} from "../../prisma/seed-movements";

export { STANDARD_MOVEMENTS, MOVEMENT_ENRICHMENTS };
export const STANDARD_MOVEMENTS_COUNT = STANDARD_MOVEMENTS.length;

type MovementClient = PrismaClient | Prisma.TransactionClient;

/**
 * Seeds the canonical 50 movements for a tenant. Accepts either a full
 * PrismaClient or a transaction client (for atomic signup flows).
 * Idempotent — uses upsert on (tenantId, slug).
 */
export async function seedDefaultMovements(
  client: MovementClient,
  tenantId: string,
): Promise<void> {
  for (const mv of STANDARD_MOVEMENTS) {
    const enrich = MOVEMENT_ENRICHMENTS[mv.slug];
    const enrichmentData: Record<string, unknown> = {};
    if (enrich) {
      if (enrich.cues) enrichmentData.cues = enrich.cues;
      if (enrich.commonMistakes)
        enrichmentData.commonMistakes = enrich.commonMistakes;
      if (enrich.progressions)
        enrichmentData.progressions = enrich.progressions;
      if (enrich.musclesWorked)
        enrichmentData.musclesWorked = enrich.musclesWorked;
      if (enrich.difficulty != null)
        enrichmentData.difficulty = enrich.difficulty;
    }
    await client.movement.upsert({
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
}
