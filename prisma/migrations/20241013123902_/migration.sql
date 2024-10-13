/*
  Warnings:

  - The values [PLANNED,IN_PROGRESS,COMPLETED] on the enum `ProjectStatusEnum` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `ProjectMember` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TaskStatusEnum" AS ENUM ('BACKLOG', 'IN_PROGRESS', 'CODE_REVIEW', 'UAT', 'DONE');

-- CreateEnum
CREATE TYPE "ProjectRoleEnum" AS ENUM ('MENTEE', 'MENTOR');

-- CreateEnum
CREATE TYPE "ProjectMemberStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterEnum
ALTER TYPE "ProjectStatusEnum" ADD VALUE 'ACTIVE';
ALTER TYPE "ProjectStatusEnum" ADD VALUE 'INACTIVE';
ALTER TYPE "ProjectStatusEnum"DROP VALUE 'PLANNED';
ALTER TYPE "ProjectStatusEnum"DROP VALUE 'IN_PROGRESS';
ALTER TYPE "ProjectStatusEnum"DROP VALUE 'COMPLETED';

-- DropForeignKey
ALTER TABLE "ProjectMember" DROP CONSTRAINT "ProjectMember_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectMember" DROP CONSTRAINT "ProjectMember_userId_fkey";

-- DropTable
DROP TABLE "ProjectMember";

-- CreateTable
CREATE TABLE "Task" (
    "id" STRING NOT NULL,
    "title" STRING NOT NULL,
    "description" STRING NOT NULL,
    "status" "TaskStatusEnum" NOT NULL DEFAULT 'BACKLOG',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" STRING NOT NULL,
    "assigneeId" STRING,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectEnrollment" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" STRING NOT NULL,
    "projectId" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "role" "ProjectRoleEnum" NOT NULL DEFAULT 'MENTEE',
    "status" "ProjectMemberStatusEnum" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "ProjectEnrollment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "ProjectEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEnrollment" ADD CONSTRAINT "ProjectEnrollment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEnrollment" ADD CONSTRAINT "ProjectEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
