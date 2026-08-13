CREATE TYPE IF NOT EXISTS "ProductVersionStatusEnum" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');

ALTER TABLE "Project" SET (schema_locked = false);
ALTER TABLE "ProjectTemplate" SET (schema_locked = false);
ALTER TABLE "Task" SET (schema_locked = false);

CREATE TABLE IF NOT EXISTS "ProductVersion" (
  "id" STRING NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "name" STRING NOT NULL,
  "description" STRING,
  "order" INT NOT NULL DEFAULT 0,
  "status" "ProductVersionStatusEnum",
  "projectId" STRING,
  "projectTemplateId" STRING,
  CONSTRAINT "ProductVersion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProductVersion" SET (schema_locked = false);

ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "productVersionId" STRING,
  ADD COLUMN IF NOT EXISTS "productVersionOrder" INT NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "ProductVersion_projectId_name_key"
  ON "ProductVersion"("projectId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVersion_projectTemplateId_name_key"
  ON "ProductVersion"("projectTemplateId", "name");
CREATE INDEX IF NOT EXISTS "ProductVersion_projectId_order_idx"
  ON "ProductVersion"("projectId", "order");
CREATE INDEX IF NOT EXISTS "ProductVersion_projectTemplateId_order_idx"
  ON "ProductVersion"("projectTemplateId", "order");
CREATE INDEX IF NOT EXISTS "Task_productVersionId_productVersionOrder_idx"
  ON "Task"("productVersionId", "productVersionOrder");

ALTER TABLE "ProductVersion"
  ADD CONSTRAINT IF NOT EXISTS "ProductVersion_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductVersion"
  ADD CONSTRAINT IF NOT EXISTS "ProductVersion_projectTemplateId_fkey"
  FOREIGN KEY ("projectTemplateId") REFERENCES "ProjectTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task"
  ADD CONSTRAINT IF NOT EXISTS "Task_productVersionId_fkey"
  FOREIGN KEY ("productVersionId") REFERENCES "ProductVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Project" SET (schema_locked = true);
ALTER TABLE "ProjectTemplate" SET (schema_locked = true);
ALTER TABLE "Task" SET (schema_locked = true);
ALTER TABLE "ProductVersion" SET (schema_locked = true);
