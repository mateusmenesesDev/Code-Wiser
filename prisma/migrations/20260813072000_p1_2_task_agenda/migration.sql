ALTER TABLE "User" SET (schema_locked = false);
ALTER TABLE "User"
ADD COLUMN "taskDeadlineRemindersEnabled" BOOL NOT NULL DEFAULT true;
ALTER TABLE "User" SET (schema_locked = true);

ALTER TABLE "Notification" SET (schema_locked = false);
ALTER TABLE "Notification"
ADD COLUMN "dedupeKey" STRING;
CREATE UNIQUE INDEX "Notification_dedupeKey_key"
ON "Notification"("dedupeKey");
ALTER TABLE "Notification" SET (schema_locked = true);

ALTER TYPE "NotificationType" ADD VALUE 'TASK_DUE_SOON';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_OVERDUE';
