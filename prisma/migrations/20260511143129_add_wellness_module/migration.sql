-- Add wellness module enum values.
-- Both enums use ADD VALUE (additive) → safe and retro-compatible.
-- No row-level changes; existing data unaffected.

-- AlterEnum
ALTER TYPE "GoalMetric" ADD VALUE 'BODY_COMPOSITION';

-- AlterEnum
ALTER TYPE "PermissionAction" ADD VALUE 'MANAGE_ATHLETE_METRICS';
