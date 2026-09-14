-- CreateEnum
CREATE TYPE IF NOT EXISTS "CompetencyProgressState" AS ENUM ('IN_DEVELOPMENT', 'DEMONSTRATED');

-- CreateTable
CREATE TABLE IF NOT EXISTS "Competency" (
    "id" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "name" STRING NOT NULL,
    "description" STRING NOT NULL,
    "sortOrder" INT8 NOT NULL DEFAULT 0,
    "isActive" BOOL NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Competency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CompetencyExerciseChallenge" (
    "competencyId" STRING NOT NULL,
    "challengeId" STRING NOT NULL,
    CONSTRAINT "CompetencyExerciseChallenge_pkey" PRIMARY KEY ("competencyId", "challengeId")
);

CREATE TABLE IF NOT EXISTS "CompetencyLearningOutcome" (
    "competencyId" STRING NOT NULL,
    "learningOutcomeId" STRING NOT NULL,
    CONSTRAINT "CompetencyLearningOutcome_pkey" PRIMARY KEY ("competencyId", "learningOutcomeId")
);

CREATE TABLE IF NOT EXISTS "CompetencyMilestone" (
    "competencyId" STRING NOT NULL,
    "milestoneId" STRING NOT NULL,
    CONSTRAINT "CompetencyMilestone_pkey" PRIMARY KEY ("competencyId", "milestoneId")
);

CREATE TABLE IF NOT EXISTS "CompetencyReviewCategory" (
    "competencyId" STRING NOT NULL,
    "category" "PRReviewFindingCategory" NOT NULL,
    CONSTRAINT "CompetencyReviewCategory_pkey" PRIMARY KEY ("competencyId", "category")
);

CREATE TABLE IF NOT EXISTS "CompetencyMentorAssessment" (
    "id" STRING NOT NULL,
    "state" "CompetencyProgressState" NOT NULL,
    "note" STRING,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "competencyId" STRING NOT NULL,
    "learnerId" STRING NOT NULL,
    "bookingId" STRING NOT NULL,
    "assessedById" STRING NOT NULL,
    CONSTRAINT "CompetencyMentorAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Competency_slug_key" ON "Competency"("slug");
CREATE INDEX IF NOT EXISTS "Competency_isActive_sortOrder_idx" ON "Competency"("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "CompetencyExerciseChallenge_challengeId_idx" ON "CompetencyExerciseChallenge"("challengeId");
CREATE INDEX IF NOT EXISTS "CompetencyLearningOutcome_learningOutcomeId_idx" ON "CompetencyLearningOutcome"("learningOutcomeId");
CREATE INDEX IF NOT EXISTS "CompetencyMilestone_milestoneId_idx" ON "CompetencyMilestone"("milestoneId");
CREATE UNIQUE INDEX IF NOT EXISTS "CompetencyMentorAssessment_bookingId_competencyId_key" ON "CompetencyMentorAssessment"("bookingId", "competencyId");
CREATE INDEX IF NOT EXISTS "CompetencyMentorAssessment_learnerId_competencyId_assessedAt_idx" ON "CompetencyMentorAssessment"("learnerId", "competencyId", "assessedAt");

-- CreateForeignKey
ALTER TABLE "CompetencyExerciseChallenge" ADD CONSTRAINT "CompetencyExerciseChallenge_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetencyExerciseChallenge" ADD CONSTRAINT "CompetencyExerciseChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "ExerciseChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetencyLearningOutcome" ADD CONSTRAINT "CompetencyLearningOutcome_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetencyLearningOutcome" ADD CONSTRAINT "CompetencyLearningOutcome_learningOutcomeId_fkey" FOREIGN KEY ("learningOutcomeId") REFERENCES "LearningOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetencyMilestone" ADD CONSTRAINT "CompetencyMilestone_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetencyMilestone" ADD CONSTRAINT "CompetencyMilestone_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetencyMentorAssessment" ADD CONSTRAINT "CompetencyMentorAssessment_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetencyMentorAssessment" ADD CONSTRAINT "CompetencyMentorAssessment_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetencyMentorAssessment" ADD CONSTRAINT "CompetencyMentorAssessment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "MentorshipBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetencyMentorAssessment" ADD CONSTRAINT "CompetencyMentorAssessment_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed the editorial catalog so the matrix is available immediately after migration.
INSERT INTO "Competency" ("id", "slug", "name", "description", "sortOrder", "updatedAt") VALUES
  ('p0_2_ui_accessibility', 'ui-accessibility', 'UI and accessibility', 'Build interfaces that are usable, understandable, and accessible.', 0, CURRENT_TIMESTAMP),
  ('p0_2_testing', 'testing', 'Testing', 'Use tests to protect behavior and make changes safely.', 1, CURRENT_TIMESTAMP),
  ('p0_2_javascript_typescript', 'javascript-typescript', 'JavaScript and TypeScript', 'Write clear, type-safe application logic.', 2, CURRENT_TIMESTAMP),
  ('p0_2_git_collaboration', 'git-collaboration', 'Git and collaboration', 'Communicate changes clearly and work safely with a team.', 3, CURRENT_TIMESTAMP),
  ('p0_2_data_modeling', 'data-modeling', 'Data modeling', 'Model data and behavior around clear domain rules.', 4, CURRENT_TIMESTAMP),
  ('p0_2_architecture', 'architecture', 'Architecture', 'Make coherent trade-offs across application boundaries.', 5, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "CompetencyReviewCategory" ("competencyId", "category") VALUES
  ('p0_2_ui_accessibility', 'DESIGN'),
  ('p0_2_ui_accessibility', 'READABILITY'),
  ('p0_2_testing', 'TESTS'),
  ('p0_2_javascript_typescript', 'CORRECTION'),
  ('p0_2_javascript_typescript', 'READABILITY'),
  ('p0_2_git_collaboration', 'CORRECTION'),
  ('p0_2_git_collaboration', 'READABILITY'),
  ('p0_2_data_modeling', 'DESIGN'),
  ('p0_2_data_modeling', 'PERFORMANCE'),
  ('p0_2_architecture', 'DESIGN'),
  ('p0_2_architecture', 'SECURITY'),
  ('p0_2_architecture', 'PERFORMANCE')
ON CONFLICT ("competencyId", "category") DO NOTHING;

INSERT INTO "CompetencyExerciseChallenge" ("competencyId", "challengeId")
SELECT 'p0_2_ui_accessibility', challenge."id"
FROM "ExerciseChallenge" challenge
JOIN "ExerciseTrack" track ON track."id" = challenge."trackId"
WHERE track."slug" = 'react' AND challenge."slug" IN ('counter', 'todo-list')
ON CONFLICT ("competencyId", "challengeId") DO NOTHING;

INSERT INTO "CompetencyExerciseChallenge" ("competencyId", "challengeId")
SELECT 'p0_2_testing', challenge."id"
FROM "ExerciseChallenge" challenge
JOIN "ExerciseTrack" track ON track."id" = challenge."trackId"
WHERE (track."slug" = 'react' AND challenge."slug" = 'todo-list')
   OR (track."slug" = 'javascript' AND challenge."slug" = 'async-fetch-wrapper')
ON CONFLICT ("competencyId", "challengeId") DO NOTHING;

INSERT INTO "CompetencyExerciseChallenge" ("competencyId", "challengeId")
SELECT 'p0_2_javascript_typescript', challenge."id"
FROM "ExerciseChallenge" challenge
JOIN "ExerciseTrack" track ON track."id" = challenge."trackId"
WHERE (track."slug" = 'javascript' AND challenge."slug" IN ('array-utilities', 'async-fetch-wrapper'))
   OR (track."slug" = 'typescript' AND challenge."slug" IN ('typed-api-client', 'discriminated-unions'))
ON CONFLICT ("competencyId", "challengeId") DO NOTHING;

INSERT INTO "CompetencyExerciseChallenge" ("competencyId", "challengeId")
SELECT 'p0_2_architecture', challenge."id"
FROM "ExerciseChallenge" challenge
JOIN "ExerciseTrack" track ON track."id" = challenge."trackId"
WHERE track."slug" = 'nextjs' AND challenge."slug" IN ('server-component-page', 'route-handler-crud')
ON CONFLICT ("competencyId", "challengeId") DO NOTHING;
