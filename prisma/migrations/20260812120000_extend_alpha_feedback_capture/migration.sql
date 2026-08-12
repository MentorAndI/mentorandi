-- Add the Feature 097 categories without removing legacy feedback values.
ALTER TYPE "FeedbackCategory" ADD VALUE IF NOT EXISTS 'ONBOARDING';
ALTER TYPE "FeedbackCategory" ADD VALUE IF NOT EXISTS 'PRICING';

-- Add optional structured context while preserving every existing submission.
ALTER TABLE "Feedback"
ADD COLUMN "ratingScore" INTEGER,
ADD COLUMN "mentorSlug" TEXT;

ALTER TABLE "Feedback"
ADD CONSTRAINT "Feedback_ratingScore_check"
CHECK ("ratingScore" IS NULL OR "ratingScore" BETWEEN 1 AND 5);
