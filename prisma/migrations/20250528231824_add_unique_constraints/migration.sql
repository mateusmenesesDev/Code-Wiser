/*
  Warnings:

  - A unique constraint covering the columns `[projectTemplateId,position]` on the table `KanbanColumn` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,position]` on the table `KanbanColumn` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectTemplateId,title]` on the table `Task` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,title]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "KanbanColumn_projectTemplateId_position_key" ON "KanbanColumn"("projectTemplateId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "KanbanColumn_projectId_position_key" ON "KanbanColumn"("projectId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Task_projectTemplateId_title_key" ON "Task"("projectTemplateId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Task_projectId_title_key" ON "Task"("projectId", "title");
