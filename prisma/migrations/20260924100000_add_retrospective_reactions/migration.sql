CREATE TYPE IF NOT EXISTS "public"."RetrospectiveReactionType" AS ENUM ('LIKE', 'DISLIKE');

CREATE TABLE IF NOT EXISTS "public"."RetrospectiveItemReaction" (
  "id" STRING NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "type" "public"."RetrospectiveReactionType" NOT NULL,
  "itemId" STRING NOT NULL,
  "userId" STRING NOT NULL,
  CONSTRAINT "RetrospectiveItemReaction_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."RetrospectiveItemReaction" SET (schema_locked = false);
ALTER TABLE "public"."RetrospectiveItem" SET (schema_locked = false);
ALTER TABLE "public"."User" SET (schema_locked = false);

CREATE UNIQUE INDEX IF NOT EXISTS "RetrospectiveItemReaction_itemId_userId_key"
  ON "public"."RetrospectiveItemReaction"("itemId", "userId");
CREATE INDEX IF NOT EXISTS "RetrospectiveItemReaction_itemId_type_idx"
  ON "public"."RetrospectiveItemReaction"("itemId", "type");
CREATE INDEX IF NOT EXISTS "RetrospectiveItemReaction_userId_idx"
  ON "public"."RetrospectiveItemReaction"("userId");

ALTER TABLE "public"."RetrospectiveItemReaction"
  ADD CONSTRAINT "RetrospectiveItemReaction_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "public"."RetrospectiveItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."RetrospectiveItemReaction"
  ADD CONSTRAINT "RetrospectiveItemReaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."RetrospectiveItemReaction" SET (schema_locked = true);
ALTER TABLE "public"."RetrospectiveItem" SET (schema_locked = true);
ALTER TABLE "public"."User" SET (schema_locked = true);
