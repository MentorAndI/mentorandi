-- CreateEnum
CREATE TYPE "FeedbackRating" AS ENUM ('USEFUL', 'NEUTRAL', 'NOT_USEFUL');

-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('BUG', 'CONFUSING', 'MENTOR_QUALITY', 'IDEA', 'OTHER');

-- CreateTable
CREATE TABLE "Feedback" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rating" "FeedbackRating" NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "message" TEXT NOT NULL,
    "pagePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_userId_createdAt_idx" ON "Feedback"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep feedback unavailable through Supabase's browser-facing roles.
ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Feedback" FROM anon;
REVOKE ALL ON TABLE "Feedback" FROM authenticated;
