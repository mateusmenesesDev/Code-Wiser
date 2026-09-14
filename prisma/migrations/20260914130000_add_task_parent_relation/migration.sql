-- AlterTable
ALTER TABLE "Task" SET (schema_locked = false);
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "parentTaskId" STRING;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Task_parentTaskId_idx" ON "Task"("parentTaskId");

-- AddForeignKey
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_parentTaskId_fkey";
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" SET (schema_locked = true);
