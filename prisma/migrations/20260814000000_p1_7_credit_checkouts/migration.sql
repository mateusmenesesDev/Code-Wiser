CREATE TYPE IF NOT EXISTS "CreditCheckoutStatus" AS ENUM (
  'OPEN',
  'PROCESSING',
  'PAID',
  'FULFILLED',
  'FAILED',
  'EXPIRED'
);

CREATE TABLE IF NOT EXISTS "CreditCheckout" (
  "id" STRING NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" STRING NOT NULL,
  "requestIdempotencyKey" STRING NOT NULL,
  "stripeSessionId" STRING NOT NULL,
  "stripeCustomerId" STRING NOT NULL,
  "packageId" STRING NOT NULL,
  "credits" INT4 NOT NULL,
  "status" "CreditCheckoutStatus" NOT NULL DEFAULT 'OPEN',
  "checkoutUrl" STRING,
  "expiresAt" TIMESTAMP(3),
  "failureReason" STRING,
  "transactionId" STRING,

  CONSTRAINT "CreditCheckout_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreditCheckout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "CreditCheckout" SET (schema_locked = false);

CREATE UNIQUE INDEX IF NOT EXISTS "CreditCheckout_requestIdempotencyKey_key" ON "CreditCheckout"("requestIdempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "CreditCheckout_stripeSessionId_key" ON "CreditCheckout"("stripeSessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "CreditCheckout_transactionId_key" ON "CreditCheckout"("transactionId");
CREATE INDEX IF NOT EXISTS "CreditCheckout_userId_createdAt_idx" ON "CreditCheckout"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "CreditCheckout_userId_status_idx" ON "CreditCheckout"("userId", "status");

ALTER TABLE "CreditCheckout" SET (schema_locked = true);
