CREATE TYPE IF NOT EXISTS "MentorshipActionStatus" AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

ALTER TABLE "MentorshipBooking" SET (schema_locked = false);

ALTER TABLE "MentorshipBooking"
  ADD COLUMN IF NOT EXISTS "sessionNotes" STRING;
ALTER TABLE "MentorshipBooking"
  ADD COLUMN IF NOT EXISTS "mentorPrivateNote" STRING;
ALTER TABLE "MentorshipBooking"
  ADD COLUMN IF NOT EXISTS "actionDueAt" TIMESTAMP(3);
ALTER TABLE "MentorshipBooking"
  ADD COLUMN IF NOT EXISTS "actionStatus" "MentorshipActionStatus";

CREATE INDEX IF NOT EXISTS "MentorshipBooking_userId_scheduledAt_idx"
  ON "MentorshipBooking"("userId", "scheduledAt");

ALTER TABLE "MentorshipBooking" SET (schema_locked = true);
