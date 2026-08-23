CREATE TYPE "CreditTransactionType" AS ENUM (
  'STARTER_GRANT',
  'PLAN_RESET',
  'PLAN_GRANT',
  'USAGE_DEBIT',
  'TOP_UP',
  'ADJUSTMENT'
);

ALTER TABLE "UsageEvent"
  ADD COLUMN "cachedInputTokens" INTEGER;

CREATE TABLE "CreditAccount" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "planBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "topUpBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "periodKey" VARCHAR(255),
  "lifetimeGranted" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "lifetimeUsed" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreditAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreditTransaction" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "accountId" UUID NOT NULL,
  "type" "CreditTransactionType" NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "balanceAfter" DECIMAL(14,2) NOT NULL,
  "apiCostUsd" DECIMAL(14,8),
  "retailCostUsd" DECIMAL(14,8),
  "provider" VARCHAR(32),
  "model" VARCHAR(128),
  "usageEventId" UUID,
  "idempotencyKey" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreditAccount_userId_key" ON "CreditAccount"("userId");
CREATE INDEX "CreditAccount_updatedAt_idx" ON "CreditAccount"("updatedAt");
CREATE UNIQUE INDEX "CreditTransaction_usageEventId_key" ON "CreditTransaction"("usageEventId");
CREATE UNIQUE INDEX "CreditTransaction_idempotencyKey_key" ON "CreditTransaction"("idempotencyKey");
CREATE INDEX "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt");
CREATE INDEX "CreditTransaction_type_createdAt_idx" ON "CreditTransaction"("type", "createdAt");
CREATE INDEX "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt");

ALTER TABLE "CreditAccount"
  ADD CONSTRAINT "CreditAccount_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CreditTransaction"
  ADD CONSTRAINT "CreditTransaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CreditTransaction"
  ADD CONSTRAINT "CreditTransaction_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "CreditAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CreditTransaction"
  ADD CONSTRAINT "CreditTransaction_usageEventId_fkey"
  FOREIGN KEY ("usageEventId") REFERENCES "UsageEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public."CreditAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CreditAccount" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."CreditTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CreditTransaction" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."CreditAccount" FROM anon, authenticated;
REVOKE ALL ON TABLE public."CreditTransaction" FROM anon, authenticated;
