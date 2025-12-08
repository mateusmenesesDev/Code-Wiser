-- CreateEnum
CREATE TYPE "PlanningPokerSessionStatusEnum" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "PlanningPokerSession" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "PlanningPokerSessionStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "currentTaskIndex" INT4 NOT NULL DEFAULT 0,
    "taskIds" STRING[],
    "projectId" STRING NOT NULL,
    "createdById" STRING NOT NULL,

    CONSTRAINT "PlanningPokerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningPokerVote" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storyPoints" INT4,
    "sessionId" STRING NOT NULL,
    "taskId" STRING NOT NULL,
    "userId" STRING NOT NULL,

    CONSTRAINT "PlanningPokerVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanningPokerSession_projectId_status_idx" ON "PlanningPokerSession"("projectId", "status");

-- CreateIndex
CREATE INDEX "PlanningPokerSession_createdById_idx" ON "PlanningPokerSession"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningPokerVote_sessionId_taskId_userId_key" ON "PlanningPokerVote"("sessionId", "taskId", "userId");

-- CreateIndex
CREATE INDEX "PlanningPokerVote_sessionId_taskId_idx" ON "PlanningPokerVote"("sessionId", "taskId");

-- CreateIndex
CREATE INDEX "PlanningPokerVote_userId_idx" ON "PlanningPokerVote"("userId");

-- AddForeignKey
ALTER TABLE "PlanningPokerSession" ADD CONSTRAINT "PlanningPokerSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningPokerSession" ADD CONSTRAINT "PlanningPokerSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningPokerVote" ADD CONSTRAINT "PlanningPokerVote_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PlanningPokerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningPokerVote" ADD CONSTRAINT "PlanningPokerVote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningPokerVote" ADD CONSTRAINT "PlanningPokerVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

