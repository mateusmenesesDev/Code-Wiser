ALTER TABLE "public"."User"
ADD COLUMN "learningGoal" STRING,
ADD COLUMN "selfReportedLevel" STRING,
ADD COLUMN "interestedTechnologies" STRING[] NOT NULL DEFAULT ARRAY[]::STRING[],
ADD COLUMN "weeklyAvailabilityBand" STRING,
ADD COLUMN "priorExperience" STRING,
ADD COLUMN "diagnosisCompletedAt" TIMESTAMP(3);
