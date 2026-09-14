CREATE TYPE "MentorAttentionSourceType" AS ENUM ('PR_REVIEW', 'EXERCISE_REVIEW', 'BLOCKED_TASK', 'INACTIVE_STUDENT', 'MENTORSHIP_SESSION');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MENTOR_REVIEW_OVERDUE';

CREATE TABLE "MentorAttentionAssignment" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceType" "MentorAttentionSourceType" NOT NULL,
    "sourceId" STRING NOT NULL,
    "sourceCreatedAt" TIMESTAMP(3) NOT NULL,
    "assignedMentorId" STRING,
    "claimedAt" TIMESTAMP(3),
    "firstResponseAt" TIMESTAMP(3),
    "firstResponseMinutes" INT8,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "escalatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completionMinutes" INT8,
    "completedById" STRING,

    CONSTRAINT "MentorAttentionAssignment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MentorAttentionAssignment_assignedMentorId_fkey" FOREIGN KEY ("assignedMentorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MentorAttentionAssignment_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MentorAttentionAssignment_sourceType_sourceId_key" ON "MentorAttentionAssignment" ("sourceType", "sourceId");
CREATE INDEX "MentorAttentionAssignment_assignedMentorId_completedAt_idx" ON "MentorAttentionAssignment" ("assignedMentorId", "completedAt");
CREATE INDEX "MentorAttentionAssignment_sourceType_sourceCreatedAt_idx" ON "MentorAttentionAssignment" ("sourceType", "sourceCreatedAt");
CREATE INDEX "MentorAttentionAssignment_dueAt_escalatedAt_idx" ON "MentorAttentionAssignment" ("dueAt", "escalatedAt");
