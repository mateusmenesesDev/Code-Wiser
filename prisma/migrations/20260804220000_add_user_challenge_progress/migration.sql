-- CreateEnum
CREATE TYPE "UserChallengeProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'IN_REVIEW', 'APPROVED', 'CHANGES_REQUESTED');

-- CreateTable
CREATE TABLE "UserChallengeProgress" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "UserChallengeProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "userId" STRING NOT NULL,
    "challengeId" STRING NOT NULL,

    CONSTRAINT "UserChallengeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserChallengeProgress_userId_status_idx" ON "UserChallengeProgress"("userId", "status");

-- CreateIndex
CREATE INDEX "UserChallengeProgress_challengeId_idx" ON "UserChallengeProgress"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserChallengeProgress_userId_challengeId_key" ON "UserChallengeProgress"("userId", "challengeId");

-- AddForeignKey
ALTER TABLE "UserChallengeProgress" ADD CONSTRAINT "UserChallengeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallengeProgress" ADD CONSTRAINT "UserChallengeProgress_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "ExerciseChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
