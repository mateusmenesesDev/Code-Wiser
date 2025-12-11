-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PR_REQUESTED', 'PR_APPROVED', 'PR_CHANGES_REQUESTED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" STRING NOT NULL,
    "message" STRING NOT NULL,
    "link" STRING,
    "read" BOOL NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "userId" STRING NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

