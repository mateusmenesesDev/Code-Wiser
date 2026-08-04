-- CreateEnum
CREATE TYPE "ExerciseReviewDecisionStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED');

-- CreateTable
CREATE TABLE "ExerciseReviewSubmission" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "prUrl" STRING NOT NULL,
    "updateNote" STRING,
    "needsAttention" BOOL NOT NULL DEFAULT true,
    "trackId" STRING NOT NULL,
    "submittedById" STRING NOT NULL,

    CONSTRAINT "ExerciseReviewSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseReviewDecision" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "ExerciseReviewDecisionStatus" NOT NULL DEFAULT 'PENDING',
    "mentorComment" STRING,
    "reviewedAt" TIMESTAMP(3),
    "submissionId" STRING NOT NULL,
    "challengeId" STRING NOT NULL,
    "reviewedById" STRING,

    CONSTRAINT "ExerciseReviewDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExerciseReviewSubmission_needsAttention_createdAt_idx" ON "ExerciseReviewSubmission"("needsAttention", "createdAt");

-- CreateIndex
CREATE INDEX "ExerciseReviewSubmission_submittedById_createdAt_idx" ON "ExerciseReviewSubmission"("submittedById", "createdAt");

-- CreateIndex
CREATE INDEX "ExerciseReviewSubmission_trackId_createdAt_idx" ON "ExerciseReviewSubmission"("trackId", "createdAt");

-- CreateIndex
CREATE INDEX "ExerciseReviewDecision_challengeId_status_idx" ON "ExerciseReviewDecision"("challengeId", "status");

-- CreateIndex
CREATE INDEX "ExerciseReviewDecision_status_updatedAt_idx" ON "ExerciseReviewDecision"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseReviewDecision_submissionId_challengeId_key" ON "ExerciseReviewDecision"("submissionId", "challengeId");

-- AddForeignKey
ALTER TABLE "ExerciseReviewSubmission" ADD CONSTRAINT "ExerciseReviewSubmission_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "ExerciseTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseReviewSubmission" ADD CONSTRAINT "ExerciseReviewSubmission_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseReviewDecision" ADD CONSTRAINT "ExerciseReviewDecision_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ExerciseReviewSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseReviewDecision" ADD CONSTRAINT "ExerciseReviewDecision_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "ExerciseChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseReviewDecision" ADD CONSTRAINT "ExerciseReviewDecision_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
