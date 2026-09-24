CREATE TABLE IF NOT EXISTS "TaskBlocker" (
  "id" STRING NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "blockedTaskId" STRING NOT NULL,
  "blockingTaskId" STRING NOT NULL,
  CONSTRAINT "TaskBlocker_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Task" SET (schema_locked = false);
ALTER TABLE "TaskBlocker" SET (schema_locked = false);

CREATE UNIQUE INDEX IF NOT EXISTS "TaskBlocker_blockedTaskId_blockingTaskId_key"
  ON "TaskBlocker"("blockedTaskId", "blockingTaskId");

INSERT INTO "TaskBlocker" ("id", "createdAt", "blockedTaskId", "blockingTaskId")
SELECT
  CONCAT('legacy-task-blocker-', task."id"),
  CURRENT_TIMESTAMP,
  task."id",
  task."blockedByTaskId"
FROM "Task" AS task
WHERE task."blockedByTaskId" IS NOT NULL
ON CONFLICT ("blockedTaskId", "blockingTaskId") DO NOTHING;

CREATE INDEX IF NOT EXISTS "TaskBlocker_blockedTaskId_idx"
  ON "TaskBlocker"("blockedTaskId");
CREATE INDEX IF NOT EXISTS "TaskBlocker_blockingTaskId_idx"
  ON "TaskBlocker"("blockingTaskId");

ALTER TABLE "TaskBlocker"
  ADD CONSTRAINT IF NOT EXISTS "TaskBlocker_blockedTaskId_fkey"
  FOREIGN KEY ("blockedTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskBlocker"
  ADD CONSTRAINT IF NOT EXISTS "TaskBlocker_blockingTaskId_fkey"
  FOREIGN KEY ("blockingTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_blockedByTaskId_fkey";
DROP INDEX IF EXISTS "Task_blockedByTaskId_idx";
ALTER TABLE "Task" DROP COLUMN IF EXISTS "blockedByTaskId";

ALTER TABLE "Task" SET (schema_locked = true);
ALTER TABLE "TaskBlocker" SET (schema_locked = true);
