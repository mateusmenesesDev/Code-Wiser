CREATE TYPE IF NOT EXISTS "CohortEventType" AS ENUM ('KICKOFF', 'CHECKPOINT', 'DELIVERY', 'CLOSURE', 'RETROSPECTIVE');
CREATE TYPE IF NOT EXISTS "CohortEventStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED');
ALTER TYPE "LearningPlanItemTargetType" ADD VALUE IF NOT EXISTS 'COHORT_EVENT';

CREATE TABLE IF NOT EXISTS "CohortEvent" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "CohortEventType" NOT NULL,
    "status" "CohortEventStatus" NOT NULL DEFAULT 'PLANNED',
    "title" STRING NOT NULL,
    "description" STRING,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "cohortId" STRING NOT NULL,
    "createdById" STRING NOT NULL,
    CONSTRAINT "CohortEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CohortEvent" SET (schema_locked = false);
ALTER TABLE "Cohort" SET (schema_locked = false);
ALTER TABLE "User" SET (schema_locked = false);

CREATE INDEX IF NOT EXISTS "CohortEvent_cohortId_startsAt_idx"
  ON "CohortEvent"("cohortId", "startsAt");
CREATE INDEX IF NOT EXISTS "CohortEvent_status_startsAt_idx"
  ON "CohortEvent"("status", "startsAt");

ALTER TABLE "CohortEvent" DROP CONSTRAINT IF EXISTS "CohortEvent_cohortId_fkey";
ALTER TABLE "CohortEvent" DROP CONSTRAINT IF EXISTS "CohortEvent_createdById_fkey";
ALTER TABLE "CohortEvent" ADD CONSTRAINT "CohortEvent_cohortId_fkey"
  FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortEvent" ADD CONSTRAINT "CohortEvent_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CohortEvent" SET (schema_locked = true);
ALTER TABLE "Cohort" SET (schema_locked = true);
ALTER TABLE "User" SET (schema_locked = true);
