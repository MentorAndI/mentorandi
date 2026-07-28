ALTER TABLE "MentorSpecialistPack" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MentorTechnique" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MentorKnowledgeCard" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MentorSource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MentorSafetyRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MentorEvalScenario" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  "MentorSpecialistPack",
  "MentorTechnique",
  "MentorKnowledgeCard",
  "MentorSource",
  "MentorSafetyRule",
  "MentorEvalScenario"
FROM anon, authenticated;
