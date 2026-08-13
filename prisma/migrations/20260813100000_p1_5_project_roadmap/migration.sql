ALTER TABLE "Project" SET (schema_locked = false);
ALTER TABLE "LearningOutcome" SET (schema_locked = false);
ALTER TABLE "Milestone" SET (schema_locked = false);
ALTER TABLE "Task" SET (schema_locked = false);
ALTER TABLE "Epic" SET (schema_locked = false);
ALTER TABLE "Sprint" SET (schema_locked = false);
ALTER TABLE "User" SET (schema_locked = false);

ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "sourceProjectTemplateId" STRING;

ALTER TABLE "LearningOutcome"
  ADD COLUMN IF NOT EXISTS "projectId" STRING;

ALTER TABLE "Milestone"
  ADD COLUMN IF NOT EXISTS "projectId" STRING;
ALTER TABLE "Milestone"
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Milestone"
  ADD COLUMN IF NOT EXISTS "reviewedById" STRING;

ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "milestoneId" STRING;
ALTER TABLE "Epic"
  ADD COLUMN IF NOT EXISTS "milestoneId" STRING;
ALTER TABLE "Sprint"
  ADD COLUMN IF NOT EXISTS "milestoneId" STRING;

CREATE INDEX IF NOT EXISTS "Project_sourceProjectTemplateId_idx"
  ON "Project"("sourceProjectTemplateId");
CREATE INDEX IF NOT EXISTS "LearningOutcome_projectId_idx"
  ON "LearningOutcome"("projectId");
CREATE INDEX IF NOT EXISTS "Milestone_projectId_order_idx"
  ON "Milestone"("projectId", "order");
CREATE INDEX IF NOT EXISTS "Milestone_reviewedById_idx"
  ON "Milestone"("reviewedById");

ALTER TABLE "Project"
  ADD CONSTRAINT IF NOT EXISTS "Project_sourceProjectTemplateId_fkey"
  FOREIGN KEY ("sourceProjectTemplateId") REFERENCES "ProjectTemplate"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LearningOutcome"
  ADD CONSTRAINT IF NOT EXISTS "LearningOutcome_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Milestone"
  ADD CONSTRAINT IF NOT EXISTS "Milestone_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Milestone"
  ADD CONSTRAINT IF NOT EXISTS "Milestone_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task"
  ADD CONSTRAINT IF NOT EXISTS "Task_milestoneId_fkey"
  FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Epic"
  ADD CONSTRAINT IF NOT EXISTS "Epic_milestoneId_fkey"
  FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sprint"
  ADD CONSTRAINT IF NOT EXISTS "Sprint_milestoneId_fkey"
  FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Project" SET (schema_locked = true);
ALTER TABLE "LearningOutcome" SET (schema_locked = true);
ALTER TABLE "Milestone" SET (schema_locked = true);
ALTER TABLE "Task" SET (schema_locked = true);
ALTER TABLE "Epic" SET (schema_locked = true);
ALTER TABLE "Sprint" SET (schema_locked = true);
ALTER TABLE "User" SET (schema_locked = true);
