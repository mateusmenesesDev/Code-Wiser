-- AlterTable
ALTER TABLE "User" ADD COLUMN "isOrgAdmin" BOOL NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "User_isOrgAdmin_idx" ON "User"("isOrgAdmin");
