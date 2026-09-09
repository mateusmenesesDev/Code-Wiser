ALTER TABLE "public"."Task" SET (schema_locked = false);

ALTER TABLE "public"."Task"
  ADD COLUMN IF NOT EXISTS "kanbanRank" INT8;

WITH ranked_project_tasks AS (
  SELECT
    "id",
    ((ROW_NUMBER() OVER (
      PARTITION BY "projectId", "status"
      ORDER BY "order" ASC NULLS LAST, "createdAt" ASC, "id" ASC
    )) * 1000000)::INT8 AS "kanbanRank"
  FROM "public"."Task"
  WHERE "projectId" IS NOT NULL AND "status" IS NOT NULL
)
UPDATE "public"."Task" AS task
SET "kanbanRank" = ranked."kanbanRank"
FROM ranked_project_tasks AS ranked
WHERE task."id" = ranked."id";

WITH ranked_template_tasks AS (
  SELECT
    "id",
    ((ROW_NUMBER() OVER (
      PARTITION BY "projectTemplateId", "status"
      ORDER BY "order" ASC NULLS LAST, "createdAt" ASC, "id" ASC
    )) * 1000000)::INT8 AS "kanbanRank"
  FROM "public"."Task"
  WHERE "projectTemplateId" IS NOT NULL AND "status" IS NOT NULL
)
UPDATE "public"."Task" AS task
SET "kanbanRank" = ranked."kanbanRank"
FROM ranked_template_tasks AS ranked
WHERE task."id" = ranked."id";

CREATE INDEX IF NOT EXISTS "Task_projectId_status_kanbanRank_idx"
  ON "public"."Task"("projectId", "status", "kanbanRank");
CREATE INDEX IF NOT EXISTS "Task_projectTemplateId_status_kanbanRank_idx"
  ON "public"."Task"("projectTemplateId", "status", "kanbanRank");

ALTER TABLE "public"."Task" SET (schema_locked = true);
