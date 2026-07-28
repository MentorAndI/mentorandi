ALTER TABLE "UsageEvent"
  ADD COLUMN "specialistPackSlug" VARCHAR(64),
  ADD COLUMN "specialistPackName" TEXT,
  ADD COLUMN "specialistPackVersion" VARCHAR(32),
  ADD COLUMN "selectedTechniqueSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "selectedTechniqueTitles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "selectedKnowledgeSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "selectedKnowledgeTitles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "selectedSafetyRuleSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "selectedSafetyRuleTitles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "specialistPromptTokens" INTEGER;

CREATE INDEX "UsageEvent_specialistPackSlug_createdAt_idx"
  ON "UsageEvent"("specialistPackSlug", "createdAt");
