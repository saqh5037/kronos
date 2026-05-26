import type { WODMovementInput } from "@/lib/validations/wod";

export type NormalizedMovement = {
  movementId: string;
  reps: number | null;
  weight: number | null;
  notes: string | undefined;
  order: number;
};

/**
 * Normalizes a WOD movement list for persistence:
 * - Assigns sequential `order` values (index-based) so duplicates are resolved
 * - Coerces undefined/null reps+weight to null
 *
 * Extracted as a pure helper so it can be unit tested independently of
 * the server action / Prisma dependency chain.
 */
export function normalizeWODMovements(
  movements: WODMovementInput[],
): NormalizedMovement[] {
  return movements.map((m, i) => ({
    movementId: m.movementId,
    reps: m.reps ?? null,
    weight: m.weight ?? null,
    notes: m.notes,
    order: i,
  }));
}
