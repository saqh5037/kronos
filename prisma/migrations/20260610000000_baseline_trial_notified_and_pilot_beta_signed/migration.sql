-- Baseline migration: drift aplicado en prod via db push, no registrado en _prisma_migrations.
-- NO correr con prisma migrate deploy en prod — marcar como aplicada con:
--   pnpm prisma migrate resolve --applied 20260610000000_baseline_trial_notified_and_pilot_beta_signed
--
-- Cambios incluidos:
--   1. Box.trialLastNotifiedAt  — campo DateTime? para throttle de emails de trial
--   2. AuditAction.PILOT_BETA_SIGNED — valor de enum para auditoría de firma beta

-- AlterTable
ALTER TABLE "Box" ADD COLUMN "trialLastNotifiedAt" TIMESTAMP(3);

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'PILOT_BETA_SIGNED';
