ALTER TABLE "PullRequestReview" SET (schema_locked = false);

DROP INDEX IF EXISTS "PullRequestReview_one_active_per_task_key";
CREATE UNIQUE INDEX IF NOT EXISTS "PullRequestReview_one_active_per_task_requester_key"
  ON "PullRequestReview" ("taskId", "requestedById")
  WHERE "isActive" = true;

CREATE INDEX IF NOT EXISTS "PullRequestReview_taskId_requestedById_isActive_idx"
  ON "PullRequestReview" ("taskId", "requestedById", "isActive");

WITH ranked_reviews AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "taskId", "requestedById"
      ORDER BY "createdAt" DESC, "id" DESC
    ) AS "rank"
  FROM "PullRequestReview"
)
UPDATE "PullRequestReview" AS review
SET "isActive" = ranked_reviews."rank" = 1
FROM ranked_reviews
WHERE review."id" = ranked_reviews."id";

ALTER TABLE "PullRequestReview" SET (schema_locked = true);
