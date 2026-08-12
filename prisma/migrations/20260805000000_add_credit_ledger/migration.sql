CREATE TYPE "CreditTransactionType" AS ENUM ('PURCHASE', 'CONSUMPTION', 'REFUND', 'ADJUSTMENT');

CREATE TYPE "CreditTransactionSource" AS ENUM (
  'STRIPE_CHECKOUT',
  'PROJECT_CREATION',
  'PROJECT_INVITATION_ACCEPTANCE',
  'PR_REVIEW_REQUEST',
  'PROJECT_MEMBER_REMOVAL',
  'PROJECT_CANCELLATION',
  'ADMIN',
  'MIGRATION'
);

CREATE TABLE "CreditTransaction" (
  "id" STRING NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" STRING NOT NULL,
  "type" "CreditTransactionType" NOT NULL,
  "value" INT4 NOT NULL,
  "source" "CreditTransactionSource" NOT NULL,
  "externalReference" STRING NOT NULL,
  "idempotencyKey" STRING NOT NULL,
  "reversalOfId" STRING,
  "actorUserId" STRING,
  "note" STRING,

  CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreditTransaction_value_check" CHECK (
    ("type" IN ('PURCHASE', 'REFUND') AND "value" > 0)
    OR ("type" = 'CONSUMPTION' AND "value" < 0)
    OR ("type" = 'ADJUSTMENT' AND "value" <> 0)
  )
);

CREATE TABLE "StripeWebhookEvent" (
  "id" STRING NOT NULL,
  "type" STRING NOT NULL,
  "externalObjectId" STRING NOT NULL,
  "stripeCreatedAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Project" ADD COLUMN "creationIdempotencyKey" STRING;
ALTER TABLE "PullRequestReview" ADD COLUMN "requestIdempotencyKey" STRING;
ALTER TABLE "ProjectCreditPaymentEvidence" ADD COLUMN "creditTransactionId" STRING;

CREATE UNIQUE INDEX "CreditTransaction_idempotencyKey_key" ON "CreditTransaction"("idempotencyKey");
CREATE UNIQUE INDEX "CreditTransaction_reversalOfId_key" ON "CreditTransaction"("reversalOfId");
CREATE INDEX "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt");
CREATE INDEX "CreditTransaction_source_externalReference_idx" ON "CreditTransaction"("source", "externalReference");
CREATE INDEX "StripeWebhookEvent_externalObjectId_idx" ON "StripeWebhookEvent"("externalObjectId");
CREATE UNIQUE INDEX "Project_creationIdempotencyKey_key" ON "Project"("creationIdempotencyKey");
CREATE UNIQUE INDEX "PullRequestReview_requestIdempotencyKey_key" ON "PullRequestReview"("requestIdempotencyKey");
CREATE UNIQUE INDEX "ProjectCreditPaymentEvidence_creditTransactionId_key" ON "ProjectCreditPaymentEvidence"("creditTransactionId");

INSERT INTO "CreditTransaction" (
  "id",
  "userId",
  "type",
  "value",
  "source",
  "externalReference",
  "idempotencyKey",
  "note"
)
SELECT
  concat('p02-opening-', "id"),
  "id",
  'ADJUSTMENT'::"CreditTransactionType",
  "credits",
  'MIGRATION'::"CreditTransactionSource",
  concat('opening-balance:', "id"),
  concat('migration:p0.2:opening:', "id"),
  'Opening balance captured when the credit ledger was introduced'
FROM "User"
WHERE "credits" <> 0;
