-- CreateTable
CREATE TABLE IF NOT EXISTS "_TaskToUser" (
    "A" STRING NOT NULL,
    "B" STRING NOT NULL
);

-- CockroachDB may lock newly created tables; unlock for remaining schema changes
ALTER TABLE "_TaskToUser" SET (schema_locked = false);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "_TaskToUser_AB_unique" ON "_TaskToUser"("A", "B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_TaskToUser_B_index" ON "_TaskToUser"("B");

-- AddForeignKey (idempotent via DO block not available; drop-if-exists then add)
ALTER TABLE "_TaskToUser" DROP CONSTRAINT IF EXISTS "_TaskToUser_A_fkey";
ALTER TABLE "_TaskToUser" ADD CONSTRAINT "_TaskToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_TaskToUser" DROP CONSTRAINT IF EXISTS "_TaskToUser_B_fkey";
ALTER TABLE "_TaskToUser" ADD CONSTRAINT "_TaskToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing single assignees into the join table
INSERT INTO "_TaskToUser" ("A", "B")
SELECT "id", "assigneeId" FROM "Task" WHERE "assigneeId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_assigneeId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN IF EXISTS "assigneeId";

-- Re-lock for changefeed performance
ALTER TABLE "_TaskToUser" SET (schema_locked = true);
