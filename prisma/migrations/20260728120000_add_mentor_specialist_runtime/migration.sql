CREATE TYPE "MentorSpecialistPackStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "MentorSafetySeverity" AS ENUM ('NORMAL', 'HIGH', 'CRISIS');
CREATE TYPE "MentorEvalScenarioType" AS ENUM ('STANDARD', 'REGRESSION', 'SAFETY');

CREATE TABLE "MentorSpecialistPack" (
  "id" UUID NOT NULL, "mentorId" UUID, "mentorSlug" VARCHAR(64) NOT NULL,
  "slug" VARCHAR(64) NOT NULL, "displayName" TEXT NOT NULL, "version" VARCHAR(32) NOT NULL,
  "status" "MentorSpecialistPackStatus" NOT NULL DEFAULT 'DRAFT', "description" TEXT NOT NULL,
  "sourcePath" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "MentorSpecialistPack_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MentorTechnique" (
  "id" UUID NOT NULL, "packId" UUID NOT NULL, "slug" VARCHAR(128) NOT NULL, "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL, "whenToUse" TEXT NOT NULL, "stepsJson" JSONB NOT NULL,
  "mentorWording" TEXT NOT NULL, "tags" TEXT[], "priority" INTEGER NOT NULL DEFAULT 0,
  "sourcePath" TEXT NOT NULL, "version" VARCHAR(32) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MentorTechnique_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MentorKnowledgeCard" (
  "id" UUID NOT NULL, "packId" UUID NOT NULL, "slug" VARCHAR(128) NOT NULL, "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL, "body" TEXT NOT NULL, "tags" TEXT[], "selectionHints" TEXT[],
  "sourceRefs" TEXT[], "priority" INTEGER NOT NULL DEFAULT 0, "sourcePath" TEXT NOT NULL,
  "version" VARCHAR(32) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "MentorKnowledgeCard_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MentorSource" (
  "id" UUID NOT NULL, "packId" UUID NOT NULL, "slug" VARCHAR(128) NOT NULL, "title" TEXT NOT NULL,
  "url" TEXT, "publisher" TEXT NOT NULL, "sourceType" TEXT NOT NULL, "usage" TEXT NOT NULL,
  "trustLevel" TEXT NOT NULL, "refreshCadence" TEXT NOT NULL, "notes" TEXT NOT NULL,
  "sourcePath" TEXT NOT NULL, "version" VARCHAR(32) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MentorSource_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MentorSafetyRule" (
  "id" UUID NOT NULL, "packId" UUID NOT NULL, "slug" VARCHAR(128) NOT NULL, "title" TEXT NOT NULL,
  "rule" TEXT NOT NULL, "triggerPatterns" TEXT[], "requiredResponseBehavior" TEXT NOT NULL,
  "severity" "MentorSafetySeverity" NOT NULL DEFAULT 'NORMAL', "sourcePath" TEXT NOT NULL,
  "version" VARCHAR(32) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "MentorSafetyRule_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MentorEvalScenario" (
  "id" UUID NOT NULL, "packId" UUID NOT NULL, "slug" VARCHAR(128) NOT NULL, "title" TEXT NOT NULL,
  "userPrompt" TEXT NOT NULL, "expectedBehavior" TEXT[], "mustUse" TEXT[], "mustAvoid" TEXT[],
  "safetyExpectation" TEXT NOT NULL, "scenarioType" "MentorEvalScenarioType" NOT NULL DEFAULT 'STANDARD',
  "sourcePath" TEXT NOT NULL, "version" VARCHAR(32) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MentorEvalScenario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MentorSpecialistPack_slug_version_key" ON "MentorSpecialistPack"("slug", "version");
CREATE UNIQUE INDEX "MentorSpecialistPack_one_active_per_mentor" ON "MentorSpecialistPack"("mentorSlug") WHERE "status" = 'ACTIVE';
CREATE INDEX "MentorSpecialistPack_mentorSlug_status_idx" ON "MentorSpecialistPack"("mentorSlug", "status");
CREATE INDEX "MentorSpecialistPack_mentorId_idx" ON "MentorSpecialistPack"("mentorId");
CREATE UNIQUE INDEX "MentorTechnique_packId_slug_key" ON "MentorTechnique"("packId", "slug");
CREATE INDEX "MentorTechnique_packId_priority_idx" ON "MentorTechnique"("packId", "priority");
CREATE UNIQUE INDEX "MentorKnowledgeCard_packId_slug_key" ON "MentorKnowledgeCard"("packId", "slug");
CREATE INDEX "MentorKnowledgeCard_packId_priority_idx" ON "MentorKnowledgeCard"("packId", "priority");
CREATE UNIQUE INDEX "MentorSource_packId_slug_key" ON "MentorSource"("packId", "slug");
CREATE INDEX "MentorSource_packId_idx" ON "MentorSource"("packId");
CREATE UNIQUE INDEX "MentorSafetyRule_packId_slug_key" ON "MentorSafetyRule"("packId", "slug");
CREATE INDEX "MentorSafetyRule_packId_severity_idx" ON "MentorSafetyRule"("packId", "severity");
CREATE UNIQUE INDEX "MentorEvalScenario_packId_slug_key" ON "MentorEvalScenario"("packId", "slug");
CREATE INDEX "MentorEvalScenario_packId_scenarioType_idx" ON "MentorEvalScenario"("packId", "scenarioType");

ALTER TABLE "MentorSpecialistPack" ADD CONSTRAINT "MentorSpecialistPack_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MentorTechnique" ADD CONSTRAINT "MentorTechnique_packId_fkey" FOREIGN KEY ("packId") REFERENCES "MentorSpecialistPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorKnowledgeCard" ADD CONSTRAINT "MentorKnowledgeCard_packId_fkey" FOREIGN KEY ("packId") REFERENCES "MentorSpecialistPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorSource" ADD CONSTRAINT "MentorSource_packId_fkey" FOREIGN KEY ("packId") REFERENCES "MentorSpecialistPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorSafetyRule" ADD CONSTRAINT "MentorSafetyRule_packId_fkey" FOREIGN KEY ("packId") REFERENCES "MentorSpecialistPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorEvalScenario" ADD CONSTRAINT "MentorEvalScenario_packId_fkey" FOREIGN KEY ("packId") REFERENCES "MentorSpecialistPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
