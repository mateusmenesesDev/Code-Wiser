ALTER TABLE "User"
ADD COLUMN "taskDeadlineRemindersEnabled" BOOL NOT NULL DEFAULT true;

ALTER TABLE "Notification"
ADD COLUMN "dedupeKey" STRING;

CREATE UNIQUE INDEX "Notification_dedupeKey_key"
ON "Notification"("dedupeKey");

ALTER TYPE "NotificationType" ADD VALUE 'TASK_DUE_SOON';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_OVERDUE';
