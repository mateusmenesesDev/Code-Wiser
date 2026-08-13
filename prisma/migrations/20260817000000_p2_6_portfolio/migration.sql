ALTER TABLE "Project" SET (schema_locked = false);
ALTER TABLE "Task" SET (schema_locked = false);
ALTER TABLE "Technology" SET (schema_locked = false);
ALTER TABLE "User" SET (schema_locked = false);

ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "portfolioSummary" STRING;
ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "portfolioDemoUrl" STRING;
ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "portfolioPublishedAt" TIMESTAMP(3);
ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "portfolioShowDemo" BOOL NOT NULL DEFAULT false;
ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "portfolioShowRepository" BOOL NOT NULL DEFAULT false;
ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "portfolioFeedback" STRING;
ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "portfolioEvaluatedAt" TIMESTAMP(3);
ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "portfolioEvaluatedById" STRING;
ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "portfolioRelevant" BOOL NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "_ProjectToTechnology" (
  "A" STRING NOT NULL,
  "B" STRING NOT NULL
);

ALTER TABLE "_ProjectToTechnology" SET (schema_locked = false);

CREATE UNIQUE INDEX IF NOT EXISTS "_ProjectToTechnology_AB_unique"
  ON "_ProjectToTechnology"("A", "B");
CREATE INDEX IF NOT EXISTS "_ProjectToTechnology_B_index"
  ON "_ProjectToTechnology"("B");
CREATE INDEX IF NOT EXISTS "Project_portfolioPublishedAt_idx"
  ON "Project"("portfolioPublishedAt");
CREATE INDEX IF NOT EXISTS "Project_portfolioEvaluatedById_idx"
  ON "Project"("portfolioEvaluatedById");
CREATE INDEX IF NOT EXISTS "Task_projectId_portfolioRelevant_idx"
  ON "Task"("projectId", "portfolioRelevant");

INSERT INTO "_ProjectToTechnology" ("A", "B")
SELECT project."id", templateTechnology."B"
FROM "Project" AS project
JOIN "_ProjectTemplateToTechnology" AS templateTechnology
  ON templateTechnology."A" = project."sourceProjectTemplateId"
ON CONFLICT ("A", "B") DO NOTHING;

ALTER TABLE "_ProjectToTechnology"
  ADD CONSTRAINT IF NOT EXISTS "_ProjectToTechnology_A_fkey"
  FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProjectToTechnology"
  ADD CONSTRAINT IF NOT EXISTS "_ProjectToTechnology_B_fkey"
  FOREIGN KEY ("B") REFERENCES "Technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project"
  ADD CONSTRAINT IF NOT EXISTS "Project_portfolioEvaluatedById_fkey"
  FOREIGN KEY ("portfolioEvaluatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Project" SET (schema_locked = true);
ALTER TABLE "Task" SET (schema_locked = true);
ALTER TABLE "Technology" SET (schema_locked = true);
ALTER TABLE "User" SET (schema_locked = true);
ALTER TABLE "_ProjectToTechnology" SET (schema_locked = true);
