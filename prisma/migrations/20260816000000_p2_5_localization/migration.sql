CREATE TYPE "UserLocale" AS ENUM ('PT_BR', 'EN');

ALTER TABLE "User" SET (schema_locked = false);
ALTER TABLE "User"
ADD COLUMN "preferredLocale" "UserLocale" NOT NULL DEFAULT 'PT_BR';
ALTER TABLE "User" SET (schema_locked = true);
