-- CreateEnum
CREATE TYPE "ProjectInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_MEMBER_ADDED';
ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_INVITATION_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_INVITATION_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_INVITATION_DECLINED';
ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_INVITATION_CANCELED';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "creditCost" INT4;

-- CreateTable
CREATE TABLE "ProjectInvitation" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "ProjectInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "creditCostSnapshot" INT4,
    "respondedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "projectId" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "invitedById" STRING NOT NULL,

    CONSTRAINT "ProjectInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectInvitation_userId_status_idx" ON "ProjectInvitation"("userId", "status");

-- CreateIndex
CREATE INDEX "ProjectInvitation_projectId_status_idx" ON "ProjectInvitation"("projectId", "status");

-- CreateIndex
CREATE INDEX "ProjectInvitation_invitedById_idx" ON "ProjectInvitation"("invitedById");

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
