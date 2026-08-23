ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'SINGLE';
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'PLUS';
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'COMPANY_STRESS';

ALTER TABLE "Subscription"
  ADD COLUMN "selectedMentorSlug" VARCHAR(64);

CREATE INDEX "Subscription_selectedMentorSlug_idx"
  ON "Subscription"("selectedMentorSlug");
