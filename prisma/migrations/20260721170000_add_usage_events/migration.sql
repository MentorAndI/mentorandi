-- CreateEnum
CREATE TYPE "UsageEventStatus" AS ENUM ('SUCCESS', 'FAILURE', 'BLOCKED');

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "mentorId" UUID,
    "conversationId" UUID,
    "provider" TEXT,
    "model" TEXT,
    "route" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "estimatedCostUsd" DECIMAL(14,8),
    "status" "UsageEventStatus" NOT NULL,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsageEvent_userId_status_createdAt_idx" ON "UsageEvent"("userId", "status", "createdAt");
CREATE INDEX "UsageEvent_status_createdAt_idx" ON "UsageEvent"("status", "createdAt");
CREATE INDEX "UsageEvent_provider_createdAt_idx" ON "UsageEvent"("provider", "createdAt");
CREATE INDEX "UsageEvent_model_createdAt_idx" ON "UsageEvent"("model", "createdAt");
CREATE INDEX "UsageEvent_mentorId_createdAt_idx" ON "UsageEvent"("mentorId", "createdAt");
CREATE INDEX "UsageEvent_conversationId_createdAt_idx" ON "UsageEvent"("conversationId", "createdAt");
CREATE INDEX "UsageEvent_route_createdAt_idx" ON "UsageEvent"("route", "createdAt");
CREATE INDEX "UsageEvent_createdAt_idx" ON "UsageEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Usage records are server-side operational data only.
ALTER TABLE public."UsageEvent" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE public."UsageEvent" FROM anon;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE public."UsageEvent" FROM authenticated;
    END IF;
END $$;
