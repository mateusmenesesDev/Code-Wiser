CREATE TYPE IF NOT EXISTS "CohortStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE IF NOT EXISTS "CohortMembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE IF NOT EXISTS "CohortPeerReviewStatus" AS ENUM ('ASSIGNED', 'SUBMITTED', 'DISMISSED');
CREATE TYPE IF NOT EXISTS "CohortPeerReviewReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

CREATE TABLE IF NOT EXISTS "Cohort" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" STRING NOT NULL,
    "description" STRING,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" "CohortStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" STRING NOT NULL,
    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CohortMembership" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "CohortMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "cohortId" STRING NOT NULL,
    "userId" STRING NOT NULL,
    CONSTRAINT "CohortMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CohortProject" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cohortId" STRING NOT NULL,
    "projectId" STRING NOT NULL,
    "assignedById" STRING NOT NULL,
    CONSTRAINT "CohortProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CohortPeerReview" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "CohortPeerReviewStatus" NOT NULL DEFAULT 'ASSIGNED',
    "feedback" STRING,
    "submittedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "cohortId" STRING NOT NULL,
    "pullRequestReviewId" STRING NOT NULL,
    "reviewerId" STRING NOT NULL,
    "authorId" STRING NOT NULL,
    "dismissedById" STRING,
    CONSTRAINT "CohortPeerReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CohortPeerReviewReport" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reason" STRING NOT NULL,
    "status" "CohortPeerReviewReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" STRING,
    "resolvedAt" TIMESTAMP(3),
    "assignmentId" STRING NOT NULL,
    "reporterId" STRING NOT NULL,
    "resolvedById" STRING,
    CONSTRAINT "CohortPeerReviewReport_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Cohort" SET (schema_locked = false);
ALTER TABLE "CohortMembership" SET (schema_locked = false);
ALTER TABLE "CohortProject" SET (schema_locked = false);
ALTER TABLE "CohortPeerReview" SET (schema_locked = false);
ALTER TABLE "CohortPeerReviewReport" SET (schema_locked = false);
ALTER TABLE "User" SET (schema_locked = false);
ALTER TABLE "Project" SET (schema_locked = false);
ALTER TABLE "PullRequestReview" SET (schema_locked = false);

CREATE UNIQUE INDEX IF NOT EXISTS "CohortMembership_cohortId_userId_key"
  ON "CohortMembership"("cohortId", "userId");
CREATE INDEX IF NOT EXISTS "Cohort_status_startsAt_idx"
  ON "Cohort"("status", "startsAt");
CREATE INDEX IF NOT EXISTS "Cohort_createdById_idx"
  ON "Cohort"("createdById");
CREATE INDEX IF NOT EXISTS "CohortMembership_userId_status_idx"
  ON "CohortMembership"("userId", "status");
CREATE INDEX IF NOT EXISTS "CohortMembership_cohortId_status_idx"
  ON "CohortMembership"("cohortId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "CohortProject_projectId_key"
  ON "CohortProject"("projectId");
CREATE INDEX IF NOT EXISTS "CohortProject_cohortId_idx"
  ON "CohortProject"("cohortId");
CREATE UNIQUE INDEX IF NOT EXISTS "CohortPeerReview_cohortId_pullRequestReviewId_reviewerId_key"
  ON "CohortPeerReview"("cohortId", "pullRequestReviewId", "reviewerId");
CREATE INDEX IF NOT EXISTS "CohortPeerReview_reviewerId_status_idx"
  ON "CohortPeerReview"("reviewerId", "status");
CREATE INDEX IF NOT EXISTS "CohortPeerReview_authorId_status_idx"
  ON "CohortPeerReview"("authorId", "status");
CREATE INDEX IF NOT EXISTS "CohortPeerReview_cohortId_status_idx"
  ON "CohortPeerReview"("cohortId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "CohortPeerReviewReport_assignmentId_reporterId_key"
  ON "CohortPeerReviewReport"("assignmentId", "reporterId");
CREATE INDEX IF NOT EXISTS "CohortPeerReviewReport_status_createdAt_idx"
  ON "CohortPeerReviewReport"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "CohortPeerReviewReport_reporterId_status_idx"
  ON "CohortPeerReviewReport"("reporterId", "status");

ALTER TABLE "Cohort" DROP CONSTRAINT IF EXISTS "Cohort_createdById_fkey";
ALTER TABLE "CohortMembership" DROP CONSTRAINT IF EXISTS "CohortMembership_cohortId_fkey";
ALTER TABLE "CohortMembership" DROP CONSTRAINT IF EXISTS "CohortMembership_userId_fkey";
ALTER TABLE "CohortProject" DROP CONSTRAINT IF EXISTS "CohortProject_cohortId_fkey";
ALTER TABLE "CohortProject" DROP CONSTRAINT IF EXISTS "CohortProject_projectId_fkey";
ALTER TABLE "CohortProject" DROP CONSTRAINT IF EXISTS "CohortProject_assignedById_fkey";
ALTER TABLE "CohortPeerReview" DROP CONSTRAINT IF EXISTS "CohortPeerReview_cohortId_fkey";
ALTER TABLE "CohortPeerReview" DROP CONSTRAINT IF EXISTS "CohortPeerReview_pullRequestReviewId_fkey";
ALTER TABLE "CohortPeerReview" DROP CONSTRAINT IF EXISTS "CohortPeerReview_reviewerId_fkey";
ALTER TABLE "CohortPeerReview" DROP CONSTRAINT IF EXISTS "CohortPeerReview_authorId_fkey";
ALTER TABLE "CohortPeerReview" DROP CONSTRAINT IF EXISTS "CohortPeerReview_dismissedById_fkey";
ALTER TABLE "CohortPeerReviewReport" DROP CONSTRAINT IF EXISTS "CohortPeerReviewReport_assignmentId_fkey";
ALTER TABLE "CohortPeerReviewReport" DROP CONSTRAINT IF EXISTS "CohortPeerReviewReport_reporterId_fkey";
ALTER TABLE "CohortPeerReviewReport" DROP CONSTRAINT IF EXISTS "CohortPeerReviewReport_resolvedById_fkey";

ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CohortMembership" ADD CONSTRAINT "CohortMembership_cohortId_fkey"
  FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortMembership" ADD CONSTRAINT "CohortMembership_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortProject" ADD CONSTRAINT "CohortProject_cohortId_fkey"
  FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortProject" ADD CONSTRAINT "CohortProject_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortProject" ADD CONSTRAINT "CohortProject_assignedById_fkey"
  FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CohortPeerReview" ADD CONSTRAINT "CohortPeerReview_cohortId_fkey"
  FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortPeerReview" ADD CONSTRAINT "CohortPeerReview_pullRequestReviewId_fkey"
  FOREIGN KEY ("pullRequestReviewId") REFERENCES "PullRequestReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortPeerReview" ADD CONSTRAINT "CohortPeerReview_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortPeerReview" ADD CONSTRAINT "CohortPeerReview_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortPeerReview" ADD CONSTRAINT "CohortPeerReview_dismissedById_fkey"
  FOREIGN KEY ("dismissedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CohortPeerReviewReport" ADD CONSTRAINT "CohortPeerReviewReport_assignmentId_fkey"
  FOREIGN KEY ("assignmentId") REFERENCES "CohortPeerReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortPeerReviewReport" ADD CONSTRAINT "CohortPeerReviewReport_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CohortPeerReviewReport" ADD CONSTRAINT "CohortPeerReviewReport_resolvedById_fkey"
  FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Cohort" SET (schema_locked = true);
ALTER TABLE "CohortMembership" SET (schema_locked = true);
ALTER TABLE "CohortProject" SET (schema_locked = true);
ALTER TABLE "CohortPeerReview" SET (schema_locked = true);
ALTER TABLE "CohortPeerReviewReport" SET (schema_locked = true);
ALTER TABLE "User" SET (schema_locked = true);
ALTER TABLE "Project" SET (schema_locked = true);
ALTER TABLE "PullRequestReview" SET (schema_locked = true);
