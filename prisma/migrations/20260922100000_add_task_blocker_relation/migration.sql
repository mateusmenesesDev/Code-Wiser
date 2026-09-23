-- Add a nullable self-relation so a task can point to the task blocking it.
ALTER TABLE "Task" SET (schema_locked = false);
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "blockedByTaskId" STRING;

CREATE INDEX IF NOT EXISTS "Task_blockedByTaskId_idx"
  ON "Task"("blockedByTaskId");

ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_blockedByTaskId_fkey";
ALTER TABLE "Task" ADD CONSTRAINT "Task_blockedByTaskId_fkey"
  FOREIGN KEY ("blockedByTaskId") REFERENCES "Task"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" SET (schema_locked = true);
