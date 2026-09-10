CREATE TYPE IF NOT EXISTS "public"."RetrospectiveCategoryEnum" AS ENUM ('WENT_WELL', 'IMPROVE', 'ACTION');

CREATE TABLE IF NOT EXISTS "public"."Retrospective" (
  "id" STRING NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "projectId" STRING NOT NULL,
  "sprintId" STRING NOT NULL,
  "createdById" STRING,
  CONSTRAINT "Retrospective_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Retrospective_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Retrospective_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "public"."Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Retrospective_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
ALTER TABLE "public"."Retrospective" SET (schema_locked = false);
CREATE UNIQUE INDEX IF NOT EXISTS "Retrospective_sprintId_key" ON "public"."Retrospective"("sprintId");
CREATE INDEX IF NOT EXISTS "Retrospective_projectId_createdAt_idx" ON "public"."Retrospective"("projectId", "createdAt");

CREATE TABLE IF NOT EXISTS "public"."RetrospectiveItem" (
  "id" STRING NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "category" "public"."RetrospectiveCategoryEnum" NOT NULL,
  "content" STRING NOT NULL,
  "completed" BOOL NOT NULL DEFAULT false,
  "order" INT4 NOT NULL DEFAULT 0,
  "retrospectiveId" STRING NOT NULL,
  "authorId" STRING,
  CONSTRAINT "RetrospectiveItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RetrospectiveItem_retrospectiveId_fkey" FOREIGN KEY ("retrospectiveId") REFERENCES "public"."Retrospective"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RetrospectiveItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
ALTER TABLE "public"."RetrospectiveItem" SET (schema_locked = false);
CREATE INDEX IF NOT EXISTS "RetrospectiveItem_retrospectiveId_category_order_idx" ON "public"."RetrospectiveItem"("retrospectiveId", "category", "order");

ALTER TABLE "public"."Retrospective" SET (schema_locked = true);
ALTER TABLE "public"."RetrospectiveItem" SET (schema_locked = true);
