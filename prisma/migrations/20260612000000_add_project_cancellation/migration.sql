ALTER TABLE "Project" ADD COLUMN "canceledAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN "canceledById" STRING;
ALTER TABLE "Project" ADD COLUMN "cancellationReason" STRING;
ALTER TABLE "Project" ADD COLUMN "refundCreditsOnCancellation" BOOL NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN "refundedCreditsOnCancellation" INT4 NOT NULL DEFAULT 0;

CREATE INDEX "Project_canceledAt_idx" ON "Project"("canceledAt");

ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_CANCELED';
