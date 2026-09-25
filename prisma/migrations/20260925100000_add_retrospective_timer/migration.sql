CREATE TYPE IF NOT EXISTS "public"."RetrospectiveTimerStatus" AS ENUM ('IDLE', 'RUNNING', 'PAUSED', 'COMPLETED');

ALTER TABLE "public"."Retrospective" SET (schema_locked = false);
ALTER TABLE "public"."Retrospective"
  ADD COLUMN IF NOT EXISTS "timerStatus" "public"."RetrospectiveTimerStatus" NOT NULL DEFAULT 'IDLE';
ALTER TABLE "public"."Retrospective"
  ADD COLUMN IF NOT EXISTS "timerDurationSeconds" INT4 NOT NULL DEFAULT 300;
ALTER TABLE "public"."Retrospective"
  ADD COLUMN IF NOT EXISTS "timerRemainingSeconds" INT4 NOT NULL DEFAULT 300;
ALTER TABLE "public"."Retrospective"
  ADD COLUMN IF NOT EXISTS "timerStartedAt" TIMESTAMP(3);
ALTER TABLE "public"."Retrospective"
  ADD COLUMN IF NOT EXISTS "timerPausedAt" TIMESTAMP(3);
ALTER TABLE "public"."Retrospective" SET (schema_locked = true);
