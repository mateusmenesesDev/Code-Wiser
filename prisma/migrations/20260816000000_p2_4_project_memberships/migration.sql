CREATE TYPE IF NOT EXISTS "ProjectMembershipStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE');
ALTER TYPE "ProjectRoleEnum" ADD VALUE IF NOT EXISTS 'OWNER';

ALTER TABLE "Project" SET (schema_locked = false);
ALTER TABLE "User" SET (schema_locked = false);
ALTER TABLE "ProjectInvitation" SET (schema_locked = false);

ALTER TABLE "ProjectInvitation"
  ADD COLUMN IF NOT EXISTS "role" "ProjectRoleEnum" NOT NULL DEFAULT 'MENTEE';

CREATE TABLE IF NOT EXISTS "ProjectMembership" (
  "id" STRING NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "role" "ProjectRoleEnum" NOT NULL DEFAULT 'MENTEE',
  "status" "ProjectMembershipStatusEnum" NOT NULL DEFAULT 'ACTIVE',
  "projectId" STRING NOT NULL,
  "userId" STRING NOT NULL,
  CONSTRAINT "ProjectMembership_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProjectMembership" SET (schema_locked = false);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectMembership_projectId_userId_key"
  ON "ProjectMembership"("projectId", "userId");

INSERT INTO "ProjectMembership" ("id", "createdAt", "updatedAt", "joinedAt", "role", "status", "projectId", "userId")
SELECT
  CONCAT('legacy-membership-', relation."A", '-', relation."B"),
  project."createdAt",
  CURRENT_TIMESTAMP,
  project."createdAt",
  CASE
    WHEN ROW_NUMBER() OVER (
      PARTITION BY relation."A"
      ORDER BY CASE WHEN EXISTS (
        SELECT 1
        FROM "ProjectCreditPaymentEvidence" AS evidence
        WHERE evidence."projectId" = relation."A"
          AND evidence."userId" = relation."B"
          AND evidence."source" = 'PROJECT_CREATION'
      ) THEN 0 ELSE 1 END, relation."B"
    ) = 1 THEN 'OWNER'::"ProjectRoleEnum"
    ELSE 'MENTEE'::"ProjectRoleEnum"
  END,
  'ACTIVE'::"ProjectMembershipStatusEnum",
  relation."A",
  relation."B"
FROM "_ProjectToUser" AS relation
JOIN "Project" AS project ON project."id" = relation."A"
ON CONFLICT ("projectId", "userId") DO NOTHING;

CREATE INDEX IF NOT EXISTS "ProjectMembership_projectId_status_idx"
  ON "ProjectMembership"("projectId", "status");
CREATE INDEX IF NOT EXISTS "ProjectMembership_projectId_role_status_idx"
  ON "ProjectMembership"("projectId", "role", "status");
CREATE INDEX IF NOT EXISTS "ProjectMembership_userId_status_idx"
  ON "ProjectMembership"("userId", "status");

ALTER TABLE "ProjectMembership"
  ADD CONSTRAINT IF NOT EXISTS "ProjectMembership_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectMembership"
  ADD CONSTRAINT IF NOT EXISTS "ProjectMembership_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE IF EXISTS "_ProjectToUser" CASCADE;

ALTER TABLE "Project" SET (schema_locked = true);
ALTER TABLE "User" SET (schema_locked = true);
ALTER TABLE "ProjectInvitation" SET (schema_locked = true);
ALTER TABLE "ProjectMembership" SET (schema_locked = true);
