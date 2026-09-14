-- CreateEnum
CREATE TYPE IF NOT EXISTS "RemediationActionTargetType" AS ENUM ('TASK', 'EXERCISE', 'MENTORSHIP');
CREATE TYPE IF NOT EXISTS "RemediationActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'CANCELLED');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REMEDIATION_ACTION_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REMEDIATION_ACTION_COMPLETED';

-- CreateTable
CREATE TABLE IF NOT EXISTS "RemediationAction" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" STRING NOT NULL,
    "description" STRING NOT NULL,
    "targetType" "RemediationActionTargetType" NOT NULL,
    "status" "RemediationActionStatus" NOT NULL DEFAULT 'OPEN',
    "dueAt" TIMESTAMP(3),
    "evidenceNote" STRING,
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "reviewerNote" STRING,
    "learnerId" STRING NOT NULL,
    "createdById" STRING NOT NULL,
    "completedById" STRING,
    "taskId" STRING,
    "challengeId" STRING,
    "bookingId" STRING,
    "sourcePrReviewId" STRING,
    "reassessmentReviewId" STRING,
    "sourceExerciseDecisionId" STRING,
    CONSTRAINT "RemediationAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RemediationAction_sourcePrReviewId_key" ON "RemediationAction"("sourcePrReviewId");
CREATE UNIQUE INDEX IF NOT EXISTS "RemediationAction_reassessmentReviewId_key" ON "RemediationAction"("reassessmentReviewId");
CREATE UNIQUE INDEX IF NOT EXISTS "RemediationAction_sourceExerciseDecisionId_key" ON "RemediationAction"("sourceExerciseDecisionId");
CREATE UNIQUE INDEX IF NOT EXISTS "RemediationAction_bookingId_key" ON "RemediationAction"("bookingId");
CREATE INDEX IF NOT EXISTS "RemediationAction_learnerId_status_updatedAt_idx" ON "RemediationAction"("learnerId", "status", "updatedAt");
CREATE INDEX IF NOT EXISTS "RemediationAction_taskId_status_idx" ON "RemediationAction"("taskId", "status");
CREATE INDEX IF NOT EXISTS "RemediationAction_challengeId_status_idx" ON "RemediationAction"("challengeId", "status");
CREATE INDEX IF NOT EXISTS "RemediationAction_bookingId_status_idx" ON "RemediationAction"("bookingId", "status");
CREATE INDEX IF NOT EXISTS "RemediationAction_reassessmentReviewId_idx" ON "RemediationAction"("reassessmentReviewId");

-- AddForeignKey
ALTER TABLE "RemediationAction" ADD CONSTRAINT "RemediationAction_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RemediationAction" ADD CONSTRAINT "RemediationAction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RemediationAction" ADD CONSTRAINT "RemediationAction_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RemediationAction" ADD CONSTRAINT "RemediationAction_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RemediationAction" ADD CONSTRAINT "RemediationAction_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "ExerciseChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RemediationAction" ADD CONSTRAINT "RemediationAction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "MentorshipBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RemediationAction" ADD CONSTRAINT "RemediationAction_sourcePrReviewId_fkey" FOREIGN KEY ("sourcePrReviewId") REFERENCES "PullRequestReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RemediationAction" ADD CONSTRAINT "RemediationAction_reassessmentReviewId_fkey" FOREIGN KEY ("reassessmentReviewId") REFERENCES "PullRequestReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RemediationAction" ADD CONSTRAINT "RemediationAction_sourceExerciseDecisionId_fkey" FOREIGN KEY ("sourceExerciseDecisionId") REFERENCES "ExerciseReviewDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
