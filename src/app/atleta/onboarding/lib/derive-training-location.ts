import type { TrainingLocation } from "@prisma/client";

export type TrainingLocationDeriveInput = {
  isB2B: boolean;
  trainsOnOwnToo: boolean;
  currentLocation: TrainingLocation | null;
};

/**
 * Pure function that derives the correct trainingLocation value based on
 * the B2B/B2C flow and the trainsOnOwnToo toggle.
 *
 * Rules:
 * - B2B + trainsOnOwnToo=false → always BOX_B2B (auto-set, no user choice needed)
 * - B2B + trainsOnOwnToo=true  → null if current is BOX_B2B or null (force pick),
 *                                 preserve if user already picked a real secondary location
 * - B2C                        → pass-through (currentLocation unchanged)
 */
export function deriveTrainingLocation({
  isB2B,
  trainsOnOwnToo,
  currentLocation,
}: TrainingLocationDeriveInput): TrainingLocation | null {
  if (!isB2B) {
    return currentLocation;
  }

  if (!trainsOnOwnToo) {
    return "BOX_B2B";
  }

  // trainsOnOwnToo=true: reset to null if the only "location" set was the
  // auto BOX_B2B value (or nothing was set yet) so the user is forced to
  // pick a real secondary location. Preserve a real user choice.
  if (currentLocation === null || currentLocation === "BOX_B2B") {
    return null;
  }

  return currentLocation;
}
