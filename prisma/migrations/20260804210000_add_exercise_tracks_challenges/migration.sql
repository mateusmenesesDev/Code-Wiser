-- CreateEnum
CREATE TYPE "ExerciseChallengeDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "ExerciseTrack" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "description" STRING NOT NULL,
    "repoUrl" STRING NOT NULL DEFAULT '',
    "isPublished" BOOL NOT NULL DEFAULT false,
    "isArchived" BOOL NOT NULL DEFAULT false,
    "sortOrder" INT4 NOT NULL DEFAULT 0,

    CONSTRAINT "ExerciseTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseChallenge" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "difficulty" "ExerciseChallengeDifficulty" NOT NULL,
    "description" STRING NOT NULL,
    "setupInstructions" STRING NOT NULL,
    "acceptanceCriteria" STRING NOT NULL,
    "isArchived" BOOL NOT NULL DEFAULT false,
    "sortOrder" INT4 NOT NULL DEFAULT 0,
    "trackId" STRING NOT NULL,

    CONSTRAINT "ExerciseChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseTrack_slug_key" ON "ExerciseTrack"("slug");

-- CreateIndex
CREATE INDEX "ExerciseTrack_isPublished_isArchived_sortOrder_idx" ON "ExerciseTrack"("isPublished", "isArchived", "sortOrder");

-- CreateIndex
CREATE INDEX "ExerciseChallenge_trackId_difficulty_sortOrder_idx" ON "ExerciseChallenge"("trackId", "difficulty", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseChallenge_trackId_slug_key" ON "ExerciseChallenge"("trackId", "slug");

-- AddForeignKey
ALTER TABLE "ExerciseChallenge" ADD CONSTRAINT "ExerciseChallenge_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "ExerciseTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
