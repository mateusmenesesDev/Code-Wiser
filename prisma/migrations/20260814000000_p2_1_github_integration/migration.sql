CREATE TABLE IF NOT EXISTS "GitHubInstallation" (
  "id" STRING NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "githubInstallationId" STRING NOT NULL,
  "accountLogin" STRING NOT NULL,
  "accountType" STRING NOT NULL,
  "active" BOOL NOT NULL DEFAULT true,
  "userId" STRING NOT NULL,
  CONSTRAINT "GitHubInstallation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GitHubRepository" (
  "id" STRING NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "owner" STRING NOT NULL,
  "name" STRING NOT NULL,
  "fullName" STRING NOT NULL,
  "htmlUrl" STRING NOT NULL,
  "private" BOOL NOT NULL DEFAULT false,
  "installationId" STRING NOT NULL,
  CONSTRAINT "GitHubRepository_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GitHubWebhookEvent" (
  "id" STRING NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "event" STRING NOT NULL,
  "action" STRING,
  "repositoryFullName" STRING,
  CONSTRAINT "GitHubWebhookEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "GitHubInstallation" SET (schema_locked = false);
ALTER TABLE "GitHubRepository" SET (schema_locked = false);
ALTER TABLE "GitHubWebhookEvent" SET (schema_locked = false);
ALTER TABLE "User" SET (schema_locked = false);
ALTER TABLE "Project" SET (schema_locked = false);
ALTER TABLE "ExerciseTrack" SET (schema_locked = false);
ALTER TABLE "PullRequestReview" SET (schema_locked = false);
ALTER TABLE "ExerciseReviewSubmission" SET (schema_locked = false);

ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "githubRepositoryId" STRING;
ALTER TABLE "ExerciseTrack"
  ADD COLUMN IF NOT EXISTS "githubRepositoryId" STRING;
ALTER TABLE "PullRequestReview"
  ADD COLUMN IF NOT EXISTS "githubPullRequestNumber" INT4;
ALTER TABLE "PullRequestReview"
  ADD COLUMN IF NOT EXISTS "githubTitle" STRING;
ALTER TABLE "PullRequestReview"
  ADD COLUMN IF NOT EXISTS "githubState" STRING;
ALTER TABLE "PullRequestReview"
  ADD COLUMN IF NOT EXISTS "githubAuthorLogin" STRING;
ALTER TABLE "PullRequestReview"
  ADD COLUMN IF NOT EXISTS "githubCommitCount" INT4;
ALTER TABLE "PullRequestReview"
  ADD COLUMN IF NOT EXISTS "githubHeadSha" STRING;
ALTER TABLE "PullRequestReview"
  ADD COLUMN IF NOT EXISTS "githubChecksStatus" STRING;
ALTER TABLE "PullRequestReview"
  ADD COLUMN IF NOT EXISTS "githubLastSyncedAt" TIMESTAMP(3);
ALTER TABLE "PullRequestReview"
  ADD COLUMN IF NOT EXISTS "githubRepositoryId" STRING;
ALTER TABLE "ExerciseReviewSubmission"
  ADD COLUMN IF NOT EXISTS "githubPullRequestNumber" INT4;
ALTER TABLE "ExerciseReviewSubmission"
  ADD COLUMN IF NOT EXISTS "githubTitle" STRING;
ALTER TABLE "ExerciseReviewSubmission"
  ADD COLUMN IF NOT EXISTS "githubState" STRING;
ALTER TABLE "ExerciseReviewSubmission"
  ADD COLUMN IF NOT EXISTS "githubAuthorLogin" STRING;
ALTER TABLE "ExerciseReviewSubmission"
  ADD COLUMN IF NOT EXISTS "githubCommitCount" INT4;
ALTER TABLE "ExerciseReviewSubmission"
  ADD COLUMN IF NOT EXISTS "githubHeadSha" STRING;
ALTER TABLE "ExerciseReviewSubmission"
  ADD COLUMN IF NOT EXISTS "githubChecksStatus" STRING;
ALTER TABLE "ExerciseReviewSubmission"
  ADD COLUMN IF NOT EXISTS "githubLastSyncedAt" TIMESTAMP(3);
ALTER TABLE "ExerciseReviewSubmission"
  ADD COLUMN IF NOT EXISTS "githubRepositoryId" STRING;

CREATE UNIQUE INDEX IF NOT EXISTS "GitHubInstallation_githubInstallationId_key"
  ON "GitHubInstallation"("githubInstallationId");
CREATE INDEX IF NOT EXISTS "GitHubInstallation_userId_active_idx"
  ON "GitHubInstallation"("userId", "active");
CREATE UNIQUE INDEX IF NOT EXISTS "GitHubRepository_installationId_fullName_key"
  ON "GitHubRepository"("installationId", "fullName");
CREATE INDEX IF NOT EXISTS "GitHubRepository_fullName_idx"
  ON "GitHubRepository"("fullName");
CREATE UNIQUE INDEX IF NOT EXISTS "Project_githubRepositoryId_key"
  ON "Project"("githubRepositoryId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExerciseTrack_githubRepositoryId_key"
  ON "ExerciseTrack"("githubRepositoryId");
CREATE INDEX IF NOT EXISTS "PullRequestReview_githubRepositoryId_githubPullRequestNumber_idx"
  ON "PullRequestReview"("githubRepositoryId", "githubPullRequestNumber");
CREATE INDEX IF NOT EXISTS "ExerciseReviewSubmission_githubRepositoryId_githubPullRequestNumber_idx"
  ON "ExerciseReviewSubmission"("githubRepositoryId", "githubPullRequestNumber");

ALTER TABLE "GitHubInstallation"
  ADD CONSTRAINT IF NOT EXISTS "GitHubInstallation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GitHubRepository"
  ADD CONSTRAINT IF NOT EXISTS "GitHubRepository_installationId_fkey"
  FOREIGN KEY ("installationId") REFERENCES "GitHubInstallation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project"
  ADD CONSTRAINT IF NOT EXISTS "Project_githubRepositoryId_fkey"
  FOREIGN KEY ("githubRepositoryId") REFERENCES "GitHubRepository"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExerciseTrack"
  ADD CONSTRAINT IF NOT EXISTS "ExerciseTrack_githubRepositoryId_fkey"
  FOREIGN KEY ("githubRepositoryId") REFERENCES "GitHubRepository"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PullRequestReview"
  ADD CONSTRAINT IF NOT EXISTS "PullRequestReview_githubRepositoryId_fkey"
  FOREIGN KEY ("githubRepositoryId") REFERENCES "GitHubRepository"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExerciseReviewSubmission"
  ADD CONSTRAINT IF NOT EXISTS "ExerciseReviewSubmission_githubRepositoryId_fkey"
  FOREIGN KEY ("githubRepositoryId") REFERENCES "GitHubRepository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GitHubInstallation" SET (schema_locked = true);
ALTER TABLE "GitHubRepository" SET (schema_locked = true);
ALTER TABLE "GitHubWebhookEvent" SET (schema_locked = true);
ALTER TABLE "User" SET (schema_locked = true);
ALTER TABLE "Project" SET (schema_locked = true);
ALTER TABLE "ExerciseTrack" SET (schema_locked = true);
ALTER TABLE "PullRequestReview" SET (schema_locked = true);
ALTER TABLE "ExerciseReviewSubmission" SET (schema_locked = true);
