CREATE INDEX "ProjectTemplate_status_sortOrder_createdAt_idx"
  ON "ProjectTemplate"("status", "sortOrder", "createdAt");

CREATE INDEX "ProjectTemplate_status_createdAt_idx"
  ON "ProjectTemplate"("status", "createdAt");

CREATE INDEX "ProjectTemplate_status_categoryId_sortOrder_idx"
  ON "ProjectTemplate"("status", "categoryId", "sortOrder");
