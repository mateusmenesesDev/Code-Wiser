-- AlterTable
ALTER TABLE "ProjectTemplate" ADD COLUMN "sortOrder" INT4 NOT NULL DEFAULT 0;

-- Backfill existing templates by creation order (home catalog default)
UPDATE "ProjectTemplate" AS t
SET "sortOrder" = s.rn - 1
FROM (
  SELECT id, row_number() OVER (ORDER BY "createdAt" ASC) AS rn
  FROM "ProjectTemplate"
) AS s
WHERE t.id = s.id;
