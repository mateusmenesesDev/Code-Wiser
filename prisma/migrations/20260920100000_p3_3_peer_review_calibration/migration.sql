CREATE TABLE IF NOT EXISTS "CohortPeerReviewCalibration" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INT4 NOT NULL,
    "attemptCount" INT4 NOT NULL DEFAULT 0,
    "score" INT4 NOT NULL DEFAULT 0,
    "total" INT4 NOT NULL,
    "passed" BOOL NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "cohortId" STRING NOT NULL,
    "reviewerId" STRING NOT NULL,
    CONSTRAINT "CohortPeerReviewCalibration_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CohortPeerReviewCalibration" SET (schema_locked = false);
ALTER TABLE "Cohort" SET (schema_locked = false);
ALTER TABLE "User" SET (schema_locked = false);

CREATE UNIQUE INDEX IF NOT EXISTS "CohortPeerReviewCalibration_cohortId_reviewerId_version_key"
  ON "CohortPeerReviewCalibration"("cohortId", "reviewerId", "version");
CREATE INDEX IF NOT EXISTS "CohortPeerReviewCalibration_reviewerId_passed_idx"
  ON "CohortPeerReviewCalibration"("reviewerId", "passed");

ALTER TABLE "CohortPeerReviewCalibration" DROP CONSTRAINT IF EXISTS "CohortPeerReviewCalibration_cohortId_fkey";
ALTER TABLE "CohortPeerReviewCalibration" DROP CONSTRAINT IF EXISTS "CohortPeerReviewCalibration_reviewerId_fkey";

ALTER TABLE "CohortPeerReviewCalibration" ADD CONSTRAINT "CohortPeerReviewCalibration_cohortId_fkey"
  FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortPeerReviewCalibration" ADD CONSTRAINT "CohortPeerReviewCalibration_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CohortPeerReviewCalibration" SET (schema_locked = true);
ALTER TABLE "Cohort" SET (schema_locked = true);
ALTER TABLE "User" SET (schema_locked = true);
