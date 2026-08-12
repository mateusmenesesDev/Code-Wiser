ALTER TABLE "PullRequestReview" SET (schema_locked = false);

ALTER TABLE "PullRequestReview"
  ADD COLUMN IF NOT EXISTS "requestedById" STRING;
ALTER TABLE "PullRequestReview"
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

UPDATE "PullRequestReview"
SET "requestedById" = COALESCE("requestedById", "reviewedById");

ALTER TABLE "PullRequestReview"
  ALTER COLUMN "requestedById" SET NOT NULL;
ALTER TABLE "PullRequestReview"
  ALTER COLUMN "reviewedById" DROP NOT NULL;

-- Before this migration reviewedById stored the requester, not the reviewer.
UPDATE "PullRequestReview"
SET "reviewedById" = NULL
WHERE "reviewedAt" IS NULL;

ALTER TABLE "PullRequestReview"
  DROP CONSTRAINT IF EXISTS "PullRequestReview_reviewedById_fkey";
ALTER TABLE "PullRequestReview"
  ADD CONSTRAINT IF NOT EXISTS "PullRequestReview_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PullRequestReview"
  ADD CONSTRAINT IF NOT EXISTS "PullRequestReview_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Keep the newest active version before enforcing one active review per task.
WITH ranked_active_reviews AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "taskId"
      ORDER BY "createdAt" DESC, "id" DESC
    ) AS "rank"
  FROM "PullRequestReview"
  WHERE "isActive" = true
)
UPDATE "PullRequestReview"
SET "isActive" = false
WHERE "id" IN (
  SELECT "id"
  FROM ranked_active_reviews
  WHERE "rank" > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS "PullRequestReview_one_active_per_task_key"
  ON "PullRequestReview"("taskId")
  WHERE "isActive" = true;

ALTER TABLE "PullRequestReview" SET (schema_locked = true);
