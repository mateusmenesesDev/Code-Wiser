-- CreateEnum
CREATE TYPE "TaskStatusEnum" AS ENUM ('BACKLOG', 'READY_TO_DEVELOP', 'IN_PROGRESS', 'CODE_REVIEW', 'TESTING', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPriorityEnum" AS ENUM ('LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST');

-- CreateEnum
CREATE TYPE "TaskTypeEnum" AS ENUM ('USER_STORY', 'TASK', 'SUBTASK', 'BUG');

-- CreateEnum
CREATE TYPE "ProjectMethodologyEnum" AS ENUM ('SCRUM', 'KANBAN');

-- CreateEnum
CREATE TYPE "ProjectStatusEnum" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REQUESTED_CHANGES', 'SEND_FOR_APPROVAL');

-- CreateEnum
CREATE TYPE "ProjectTypeEnum" AS ENUM ('FREE', 'CREDITS', 'MENTORSHIP');

-- CreateEnum
CREATE TYPE "ProjectDifficultyEnum" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ProjectRoleEnum" AS ENUM ('MENTEE', 'MENTOR');

-- CreateEnum
CREATE TYPE "ResourceTypeEnum" AS ENUM ('CODE', 'DOCUMENTATION', 'VIDEO', 'ARTICLE', 'RECOMMENDED', 'OTHER');

-- CreateEnum
CREATE TYPE "EpicStatusEnum" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "Project" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "description" STRING NOT NULL,
    "methodology" "ProjectMethodologyEnum" NOT NULL DEFAULT 'SCRUM',
    "minParticipants" INT4 NOT NULL,
    "maxParticipants" INT4 NOT NULL,
    "type" "ProjectTypeEnum" NOT NULL,
    "difficulty" "ProjectDifficultyEnum" NOT NULL,
    "figmaProjectUrl" STRING,
    "categoryId" STRING NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectImage" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" STRING NOT NULL,
    "url" STRING NOT NULL,
    "alt" STRING,
    "order" INT4 NOT NULL DEFAULT 0,
    "projectTemplateId" STRING,

    CONSTRAINT "ProjectImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningOutcome" (
    "id" STRING NOT NULL,
    "value" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectTemplateId" STRING,

    CONSTRAINT "LearningOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "approved" BOOL NOT NULL DEFAULT false,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technology" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "approved" BOOL NOT NULL DEFAULT false,

    CONSTRAINT "Technology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" STRING NOT NULL,
    "title" STRING NOT NULL,
    "link" STRING NOT NULL,
    "type" "ResourceTypeEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" STRING,
    "projectTemplateId" STRING,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" STRING NOT NULL,
    "title" STRING NOT NULL,
    "description" STRING,
    "order" INT4 NOT NULL DEFAULT 0,
    "status" STRING DEFAULT 'PENDING',
    "completed" BOOL NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectTemplateId" STRING,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" STRING NOT NULL,
    "description" STRING,
    "type" "TaskTypeEnum" DEFAULT 'USER_STORY',
    "tags" STRING[],
    "priority" "TaskPriorityEnum",
    "status" "TaskStatusEnum" DEFAULT 'BACKLOG',
    "dueDate" TIMESTAMP(3),
    "blocked" BOOL DEFAULT false,
    "blockedReason" STRING,
    "storyPoints" INT4,
    "assigneeId" STRING,
    "projectId" STRING,
    "projectTemplateId" STRING,
    "epicId" STRING,
    "sprintId" STRING,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Epic" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" STRING NOT NULL,
    "description" STRING,
    "status" "EpicStatusEnum",
    "progress" INT4,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "projectId" STRING,
    "projectTemplateId" STRING,

    CONSTRAINT "Epic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sprint" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" STRING NOT NULL,
    "description" STRING,
    "projectTemplateSlug" STRING,
    "projectSlug" STRING,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    CONSTRAINT "Sprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" STRING NOT NULL,
    "authorId" STRING NOT NULL,
    "taskId" STRING NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTemplate" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "description" STRING NOT NULL,
    "methodology" "ProjectMethodologyEnum" NOT NULL DEFAULT 'SCRUM',
    "minParticipants" INT4 NOT NULL,
    "maxParticipants" INT4 NOT NULL,
    "credits" INT4,
    "type" "ProjectTypeEnum" NOT NULL,
    "status" "ProjectStatusEnum" NOT NULL DEFAULT 'PENDING',
    "difficulty" "ProjectDifficultyEnum" NOT NULL,
    "figmaProjectUrl" STRING,
    "expectedDuration" STRING,
    "categoryId" STRING NOT NULL,

    CONSTRAINT "ProjectTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" STRING NOT NULL,
    "email" STRING NOT NULL,
    "name" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "credits" INT4 NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProjectToUser" (
    "A" STRING NOT NULL,
    "B" STRING NOT NULL
);

-- CreateTable
CREATE TABLE "_ProjectTemplateToTechnology" (
    "A" STRING NOT NULL,
    "B" STRING NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_title_key" ON "Project"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Technology_name_key" ON "Technology"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Task_projectTemplateId_title_key" ON "Task"("projectTemplateId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Task_projectId_title_key" ON "Task"("projectId", "title");

-- CreateIndex
CREATE INDEX "Comment_taskId_createdAt_idx" ON "Comment"("taskId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTemplate_title_key" ON "ProjectTemplate"("title");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTemplate_slug_key" ON "ProjectTemplate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectToUser_AB_unique" ON "_ProjectToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectToUser_B_index" ON "_ProjectToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectTemplateToTechnology_AB_unique" ON "_ProjectTemplateToTechnology"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectTemplateToTechnology_B_index" ON "_ProjectTemplateToTechnology"("B");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectImage" ADD CONSTRAINT "ProjectImage_projectTemplateId_fkey" FOREIGN KEY ("projectTemplateId") REFERENCES "ProjectTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningOutcome" ADD CONSTRAINT "LearningOutcome_projectTemplateId_fkey" FOREIGN KEY ("projectTemplateId") REFERENCES "ProjectTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_projectTemplateId_fkey" FOREIGN KEY ("projectTemplateId") REFERENCES "ProjectTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectTemplateId_fkey" FOREIGN KEY ("projectTemplateId") REFERENCES "ProjectTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectTemplateId_fkey" FOREIGN KEY ("projectTemplateId") REFERENCES "ProjectTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES "Epic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Epic" ADD CONSTRAINT "Epic_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Epic" ADD CONSTRAINT "Epic_projectTemplateId_fkey" FOREIGN KEY ("projectTemplateId") REFERENCES "ProjectTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_projectTemplateSlug_fkey" FOREIGN KEY ("projectTemplateSlug") REFERENCES "ProjectTemplate"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_projectSlug_fkey" FOREIGN KEY ("projectSlug") REFERENCES "Project"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTemplate" ADD CONSTRAINT "ProjectTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToUser" ADD CONSTRAINT "_ProjectToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToUser" ADD CONSTRAINT "_ProjectToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectTemplateToTechnology" ADD CONSTRAINT "_ProjectTemplateToTechnology_A_fkey" FOREIGN KEY ("A") REFERENCES "ProjectTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectTemplateToTechnology" ADD CONSTRAINT "_ProjectTemplateToTechnology_B_fkey" FOREIGN KEY ("B") REFERENCES "Technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;
