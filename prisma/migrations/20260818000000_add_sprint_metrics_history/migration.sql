CREATE TYPE IF NOT EXISTS "public"."SprintChangeTypeEnum" AS ENUM ('TASK_ADDED', 'TASK_REMOVED', 'ESTIMATE_CHANGED');

ALTER TABLE "public"."Sprint" SET (schema_locked = false);
ALTER TABLE "public"."Sprint"
  ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "committedPoints" INT4,
  ADD COLUMN IF NOT EXISTS "committedTaskCount" INT4,
  ADD COLUMN IF NOT EXISTS "committedUnestimatedCount" INT4;

CREATE TABLE IF NOT EXISTS "public"."SprintChange" (
  "id" STRING NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "type" "public"."SprintChangeTypeEnum" NOT NULL,
  "previousStoryPoints" INT4,
  "newStoryPoints" INT4,
  "sprintId" STRING NOT NULL,
  "taskId" STRING,
  "authorId" STRING,
  CONSTRAINT "SprintChange_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SprintChange_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "public"."Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SprintChange_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SprintChange_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
ALTER TABLE "public"."SprintChange" SET (schema_locked = false);
CREATE INDEX IF NOT EXISTS "SprintChange_sprintId_createdAt_idx" ON "public"."SprintChange"("sprintId", "createdAt");
CREATE INDEX IF NOT EXISTS "SprintChange_taskId_idx" ON "public"."SprintChange"("taskId");

CREATE TABLE IF NOT EXISTS "public"."SprintDailySnapshot" (
  "id" STRING NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "day" TIMESTAMP(3) NOT NULL,
  "committedPoints" INT4,
  "currentPoints" INT4 NOT NULL,
  "completedPoints" INT4 NOT NULL,
  "remainingPoints" INT4 NOT NULL,
  "taskCount" INT4 NOT NULL,
  "completedTaskCount" INT4 NOT NULL,
  "unestimatedTaskCount" INT4 NOT NULL,
  "sprintId" STRING NOT NULL,
  CONSTRAINT "SprintDailySnapshot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SprintDailySnapshot_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "public"."Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "public"."SprintDailySnapshot" SET (schema_locked = false);
CREATE UNIQUE INDEX IF NOT EXISTS "SprintDailySnapshot_sprintId_day_key" ON "public"."SprintDailySnapshot"("sprintId", "day");
CREATE INDEX IF NOT EXISTS "SprintDailySnapshot_sprintId_day_idx" ON "public"."SprintDailySnapshot"("sprintId", "day");

CREATE UNIQUE INDEX IF NOT EXISTS "Sprint_projectId_active_key"
  ON "public"."Sprint"("projectId")
  WHERE "projectId" IS NOT NULL AND "status" = 'ACTIVE';

ALTER TABLE "public"."Sprint" SET (schema_locked = true);
