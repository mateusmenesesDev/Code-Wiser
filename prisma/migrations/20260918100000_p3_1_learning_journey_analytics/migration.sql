CREATE TYPE IF NOT EXISTS "LearningJourneyEventType" AS ENUM (
  'FIRST_ACTION',
  'RECOMMENDATION_IMPRESSION',
  'RECOMMENDATION_STARTED',
  'REMEDIATION_COMPLETED',
  'REVIEW_RESPONDED',
  'SECOND_EVALUATION_APPROVED'
);

CREATE TABLE IF NOT EXISTS "LearningJourneyEvent" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" "LearningJourneyEventType" NOT NULL,
    "eventKey" STRING NOT NULL,
    "entityType" STRING NOT NULL,
    "entityId" STRING NOT NULL,
    "recommendationKey" STRING,
    "userId" STRING NOT NULL,
    CONSTRAINT "LearningJourneyEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LearningJourneyEvent" SET (schema_locked = false);
ALTER TABLE "User" SET (schema_locked = false);

CREATE UNIQUE INDEX IF NOT EXISTS "LearningJourneyEvent_eventKey_key"
  ON "LearningJourneyEvent"("eventKey");
CREATE INDEX IF NOT EXISTS "LearningJourneyEvent_eventType_occurredAt_idx"
  ON "LearningJourneyEvent"("eventType", "occurredAt");
CREATE INDEX IF NOT EXISTS "LearningJourneyEvent_userId_eventType_occurredAt_idx"
  ON "LearningJourneyEvent"("userId", "eventType", "occurredAt");

ALTER TABLE "LearningJourneyEvent" DROP CONSTRAINT IF EXISTS "LearningJourneyEvent_userId_fkey";
ALTER TABLE "LearningJourneyEvent" ADD CONSTRAINT "LearningJourneyEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LearningJourneyEvent" SET (schema_locked = true);
ALTER TABLE "User" SET (schema_locked = true);
