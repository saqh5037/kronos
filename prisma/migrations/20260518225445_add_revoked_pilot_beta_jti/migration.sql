-- CreateTable
CREATE TABLE "RevokedPilotBetaJti" (
    "jti" TEXT NOT NULL,
    "boxId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "RevokedPilotBetaJti_pkey" PRIMARY KEY ("jti")
);

-- CreateIndex
CREATE INDEX "RevokedPilotBetaJti_boxId_idx" ON "RevokedPilotBetaJti"("boxId");
