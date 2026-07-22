CREATE TYPE "SubscriptionPlan" AS ENUM ('ALPHA', 'FREE', 'PERSONAL', 'PREMIUM', 'FOUNDER');
CREATE TYPE "SubscriptionStatus" AS ENUM ('INACTIVE', 'INCOMPLETE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID');

CREATE TABLE "Subscription" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "plan" "SubscriptionPlan" NOT NULL DEFAULT 'ALPHA',
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'INACTIVE',
  "billingProvider" VARCHAR(32),
  "billingCustomerId" VARCHAR(255),
  "billingSubscriptionId" VARCHAR(255),
  "currentPeriodEnd" TIMESTAMP(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
CREATE UNIQUE INDEX "Subscription_billingCustomerId_key" ON "Subscription"("billingCustomerId");
CREATE UNIQUE INDEX "Subscription_billingSubscriptionId_key" ON "Subscription"("billingSubscriptionId");
CREATE INDEX "Subscription_plan_status_idx" ON "Subscription"("plan", "status");
CREATE INDEX "Subscription_status_currentPeriodEnd_idx" ON "Subscription"("status", "currentPeriodEnd");
CREATE INDEX "Subscription_createdAt_idx" ON "Subscription"("createdAt");

ALTER TABLE "Subscription"
  ADD CONSTRAINT "Subscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public."Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Subscription" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Subscription" FROM anon, authenticated;
