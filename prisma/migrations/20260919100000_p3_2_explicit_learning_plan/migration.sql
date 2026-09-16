CREATE TYPE IF NOT EXISTS "LearningPlanItemStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');
CREATE TYPE IF NOT EXISTS "LearningPlanItemTargetType" AS ENUM ('TASK', 'EXERCISE', 'REMEDIATION', 'MENTORSHIP', 'CUSTOM');

CREATE TABLE IF NOT EXISTS "LearningPlan" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" STRING NOT NULL,
    "objective" STRING,
    "learnerId" STRING NOT NULL,
    "createdById" STRING,
    CONSTRAINT "LearningPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LearningPlanItem" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "position" INT4 NOT NULL,
    "title" STRING NOT NULL,
    "reason" STRING NOT NULL,
    "dueAt" TIMESTAMP(3),
    "status" "LearningPlanItemStatus" NOT NULL DEFAULT 'PLANNED',
    "targetType" "LearningPlanItemTargetType" NOT NULL,
    "targetId" STRING,
    "targetHref" STRING,
    "planId" STRING NOT NULL,
    CONSTRAINT "LearningPlanItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LearningPlanItemDependency" (
    "itemId" STRING NOT NULL,
    "prerequisiteItemId" STRING NOT NULL,
    CONSTRAINT "LearningPlanItemDependency_pkey" PRIMARY KEY ("itemId", "prerequisiteItemId")
);

ALTER TABLE "LearningPlan" SET (schema_locked = false);
ALTER TABLE "LearningPlanItem" SET (schema_locked = false);
ALTER TABLE "LearningPlanItemDependency" SET (schema_locked = false);
ALTER TABLE "User" SET (schema_locked = false);

CREATE UNIQUE INDEX IF NOT EXISTS "LearningPlan_learnerId_key"
  ON "LearningPlan"("learnerId");
CREATE UNIQUE INDEX IF NOT EXISTS "LearningPlanItem_planId_position_key"
  ON "LearningPlanItem"("planId", "position");
CREATE INDEX IF NOT EXISTS "LearningPlanItem_planId_status_position_idx"
  ON "LearningPlanItem"("planId", "status", "position");
CREATE INDEX IF NOT EXISTS "LearningPlanItemDependency_prerequisiteItemId_idx"
  ON "LearningPlanItemDependency"("prerequisiteItemId");

ALTER TABLE "LearningPlan" DROP CONSTRAINT IF EXISTS "LearningPlan_learnerId_fkey";
ALTER TABLE "LearningPlan" DROP CONSTRAINT IF EXISTS "LearningPlan_createdById_fkey";
ALTER TABLE "LearningPlanItem" DROP CONSTRAINT IF EXISTS "LearningPlanItem_planId_fkey";
ALTER TABLE "LearningPlanItemDependency" DROP CONSTRAINT IF EXISTS "LearningPlanItemDependency_itemId_fkey";
ALTER TABLE "LearningPlanItemDependency" DROP CONSTRAINT IF EXISTS "LearningPlanItemDependency_prerequisiteItemId_fkey";

ALTER TABLE "LearningPlan" ADD CONSTRAINT "LearningPlan_learnerId_fkey"
  FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningPlan" ADD CONSTRAINT "LearningPlan_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LearningPlanItem" ADD CONSTRAINT "LearningPlanItem_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "LearningPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningPlanItemDependency" ADD CONSTRAINT "LearningPlanItemDependency_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "LearningPlanItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningPlanItemDependency" ADD CONSTRAINT "LearningPlanItemDependency_prerequisiteItemId_fkey"
  FOREIGN KEY ("prerequisiteItemId") REFERENCES "LearningPlanItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LearningPlan" SET (schema_locked = true);
ALTER TABLE "LearningPlanItem" SET (schema_locked = true);
ALTER TABLE "LearningPlanItemDependency" SET (schema_locked = true);
ALTER TABLE "User" SET (schema_locked = true);
