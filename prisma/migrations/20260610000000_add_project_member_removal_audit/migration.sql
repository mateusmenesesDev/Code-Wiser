-- CreateEnum
CREATE TYPE "ProjectMemberRemovalRefundStatus" AS ENUM ('NOT_APPLICABLE', 'NOT_REQUESTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ProjectCreditPaymentEvidenceSource" AS ENUM ('PROJECT_CREATION', 'PROJECT_INVITATION_ACCEPTANCE');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_MEMBER_REMOVED';

-- CreateTable
CREATE TABLE "ProjectCreditPaymentEvidence" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "credits" INT4 NOT NULL,
    "source" "ProjectCreditPaymentEvidenceSource" NOT NULL,
    "projectInvitationId" STRING,

    CONSTRAINT "ProjectCreditPaymentEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMemberRemovalAudit" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" STRING NOT NULL,
    "projectTitleSnapshot" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "userEmailSnapshot" STRING NOT NULL,
    "removedById" STRING NOT NULL,
    "reason" STRING,
    "memberCountBefore" INT4 NOT NULL,
    "wasLastMember" BOOL NOT NULL DEFAULT false,
    "wasSelfRemoval" BOOL NOT NULL DEFAULT false,
    "tasksUnassigned" INT4 NOT NULL DEFAULT 0,
    "refundEligible" BOOL NOT NULL DEFAULT false,
    "refundRequested" BOOL NOT NULL DEFAULT false,
    "refundStatus" "ProjectMemberRemovalRefundStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "refundedCredits" INT4,
    "paymentEvidenceId" STRING,
    "legacyPaymentEvidenceInvitationId" STRING,

    CONSTRAINT "ProjectMemberRemovalAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCreditPaymentEvidence_projectInvitationId_key" ON "ProjectCreditPaymentEvidence"("projectInvitationId");

-- CreateIndex
CREATE INDEX "ProjectCreditPaymentEvidence_projectId_userId_idx" ON "ProjectCreditPaymentEvidence"("projectId", "userId");

-- CreateIndex
CREATE INDEX "ProjectCreditPaymentEvidence_userId_idx" ON "ProjectCreditPaymentEvidence"("userId");

-- CreateIndex
CREATE INDEX "ProjectMemberRemovalAudit_projectId_userId_idx" ON "ProjectMemberRemovalAudit"("projectId", "userId");

-- CreateIndex
CREATE INDEX "ProjectMemberRemovalAudit_removedById_idx" ON "ProjectMemberRemovalAudit"("removedById");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMemberRemovalAudit_paymentEvidenceId_key" ON "ProjectMemberRemovalAudit"("paymentEvidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMemberRemovalAudit_legacyPaymentEvidenceInvitationId_key" ON "ProjectMemberRemovalAudit"("legacyPaymentEvidenceInvitationId");

-- AddForeignKey
ALTER TABLE "ProjectCreditPaymentEvidence" ADD CONSTRAINT "ProjectCreditPaymentEvidence_projectInvitationId_fkey" FOREIGN KEY ("projectInvitationId") REFERENCES "ProjectInvitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMemberRemovalAudit" ADD CONSTRAINT "ProjectMemberRemovalAudit_paymentEvidenceId_fkey" FOREIGN KEY ("paymentEvidenceId") REFERENCES "ProjectCreditPaymentEvidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMemberRemovalAudit" ADD CONSTRAINT "ProjectMemberRemovalAudit_legacyPaymentEvidenceInvitationId_fkey" FOREIGN KEY ("legacyPaymentEvidenceInvitationId") REFERENCES "ProjectInvitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
