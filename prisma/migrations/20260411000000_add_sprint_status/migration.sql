-- CreateEnum
CREATE TYPE "public"."SprintStatusEnum" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "public"."Sprint" ADD COLUMN "status" "public"."SprintStatusEnum" NOT NULL DEFAULT 'PLANNING';
