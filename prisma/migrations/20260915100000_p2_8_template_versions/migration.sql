ALTER TABLE "ProjectTemplate" SET (schema_locked = false);

ALTER TABLE "ProjectTemplate"
  ADD COLUMN IF NOT EXISTS "templateKey" STRING;
ALTER TABLE "ProjectTemplate"
  ADD COLUMN IF NOT EXISTS "version" INT4 NOT NULL DEFAULT 1;
ALTER TABLE "ProjectTemplate"
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
ALTER TABLE "ProjectTemplate"
  ADD COLUMN IF NOT EXISTS "changeSummary" STRING;
ALTER TABLE "ProjectTemplate"
  ADD COLUMN IF NOT EXISTS "reviewNote" STRING;

UPDATE "ProjectTemplate"
SET "templateKey" = gen_random_uuid()::STRING
WHERE "templateKey" IS NULL;

UPDATE "ProjectTemplate"
SET "publishedAt" = "createdAt"
WHERE "status" = 'APPROVED' AND "publishedAt" IS NULL;

ALTER TABLE "ProjectTemplate"
  ALTER COLUMN "templateKey" SET NOT NULL;

DROP INDEX IF EXISTS "ProjectTemplate_title_key";

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectTemplate_templateKey_version_key"
  ON "ProjectTemplate"("templateKey", "version");
CREATE INDEX IF NOT EXISTS "ProjectTemplate_templateKey_version_idx"
  ON "ProjectTemplate"("templateKey", "version");

ALTER TABLE "ProjectTemplate" SET (schema_locked = true);
