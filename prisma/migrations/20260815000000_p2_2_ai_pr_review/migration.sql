CREATE TYPE IF NOT EXISTS "PRReviewAnalysisStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE IF NOT EXISTS "PRReviewFindingDecision" AS ENUM ('PENDING', 'ACCEPTED', 'DISCARDED');
CREATE TYPE IF NOT EXISTS "PRReviewFindingSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE IF NOT EXISTS "PRReviewFindingCategory" AS ENUM ('CORRECTION', 'SECURITY', 'PERFORMANCE', 'DESIGN', 'TESTS', 'READABILITY');

ALTER TABLE "PullRequestReview" SET (schema_locked = false);
ALTER TABLE "User" SET (schema_locked = false);

ALTER TABLE "PullRequestReview"
  ADD COLUMN IF NOT EXISTS "feedbackAssistedByAi" BOOL NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "PrReviewAnalysis" (
  "id" STRING NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "reviewId" STRING NOT NULL,
  "requestedById" STRING NOT NULL,
  "status" "PRReviewAnalysisStatus" NOT NULL DEFAULT 'QUEUED',
  "sourceHeadSha" STRING NOT NULL,
  "attempts" INT4 NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "provider" STRING,
  "model" STRING,
  "promptVersion" STRING NOT NULL,
  "inputSha256" STRING,
  "includedFiles" INT4 NOT NULL DEFAULT 0,
  "excludedFiles" INT4 NOT NULL DEFAULT 0,
  "inputCharacters" INT4 NOT NULL DEFAULT 0,
  "wasTruncated" BOOL NOT NULL DEFAULT false,
  "inputTokens" INT4,
  "outputTokens" INT4,
  "totalTokens" INT4,
  "errorCode" STRING,
  "errorMessage" STRING,
  CONSTRAINT "PrReviewAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PrReviewFinding" (
  "id" STRING NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "analysisId" STRING NOT NULL,
  "filePath" STRING NOT NULL,
  "line" INT4,
  "severity" "PRReviewFindingSeverity" NOT NULL,
  "category" "PRReviewFindingCategory" NOT NULL,
  "problem" STRING NOT NULL,
  "justification" STRING NOT NULL,
  "suggestion" STRING NOT NULL,
  "confidence" FLOAT8 NOT NULL,
  "editedSeverity" "PRReviewFindingSeverity",
  "editedCategory" "PRReviewFindingCategory",
  "editedProblem" STRING,
  "editedJustification" STRING,
  "editedSuggestion" STRING,
  "editedConfidence" FLOAT8,
  "decision" "PRReviewFindingDecision" NOT NULL DEFAULT 'PENDING',
  "decisionById" STRING,
  "decidedAt" TIMESTAMP(3),
  "displayOrder" INT4 NOT NULL,
  CONSTRAINT "PrReviewFinding_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PrReviewAnalysis" SET (schema_locked = false);
ALTER TABLE "PrReviewFinding" SET (schema_locked = false);

CREATE UNIQUE INDEX IF NOT EXISTS "PrReviewAnalysis_reviewId_sourceHeadSha_key"
  ON "PrReviewAnalysis"("reviewId", "sourceHeadSha");
CREATE INDEX IF NOT EXISTS "PrReviewAnalysis_status_createdAt_idx"
  ON "PrReviewAnalysis"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "PrReviewAnalysis_reviewId_createdAt_idx"
  ON "PrReviewAnalysis"("reviewId", "createdAt");
CREATE INDEX IF NOT EXISTS "PrReviewFinding_analysisId_decision_displayOrder_idx"
  ON "PrReviewFinding"("analysisId", "decision", "displayOrder");

ALTER TABLE "PrReviewAnalysis"
  ADD CONSTRAINT IF NOT EXISTS "PrReviewAnalysis_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "PullRequestReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrReviewAnalysis"
  ADD CONSTRAINT IF NOT EXISTS "PrReviewAnalysis_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrReviewFinding"
  ADD CONSTRAINT IF NOT EXISTS "PrReviewFinding_analysisId_fkey"
  FOREIGN KEY ("analysisId") REFERENCES "PrReviewAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrReviewFinding"
  ADD CONSTRAINT IF NOT EXISTS "PrReviewFinding_decisionById_fkey"
  FOREIGN KEY ("decisionById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PrReviewAnalysis" SET (schema_locked = true);
ALTER TABLE "PrReviewFinding" SET (schema_locked = true);
ALTER TABLE "PullRequestReview" SET (schema_locked = true);
ALTER TABLE "User" SET (schema_locked = true);
