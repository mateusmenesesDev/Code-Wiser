ALTER TABLE "MentorshipBooking" SET (schema_locked = false);

ALTER TABLE "MentorshipBooking"
  ADD COLUMN IF NOT EXISTS "objective" STRING;
ALTER TABLE "MentorshipBooking"
  ADD COLUMN IF NOT EXISTS "followUp" STRING;

ALTER TABLE "User" SET (schema_locked = false);
ALTER TABLE "Task" SET (schema_locked = false);
ALTER TABLE "PullRequestReview" SET (schema_locked = false);

CREATE INDEX IF NOT EXISTS "User_updatedAt_idx"
  ON "User" ("updatedAt");
CREATE INDEX IF NOT EXISTS "Task_blocked_updatedAt_idx"
  ON "Task" ("blocked", "updatedAt");
CREATE INDEX IF NOT EXISTS "PullRequestReview_isActive_status_createdAt_idx"
  ON "PullRequestReview" ("isActive", "status", "createdAt");

ALTER TABLE "User" SET (schema_locked = true);
ALTER TABLE "Task" SET (schema_locked = true);
ALTER TABLE "PullRequestReview" SET (schema_locked = true);
ALTER TABLE "MentorshipBooking" SET (schema_locked = true);
