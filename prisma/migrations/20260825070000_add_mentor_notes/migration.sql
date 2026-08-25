CREATE TYPE "MentorNoteType" AS ENUM ('TECHNIQUE', 'PRACTICE', 'PLAN', 'REMEMBER');

CREATE TABLE "MentorNote" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "mentorId" UUID NOT NULL,
    "conversationId" UUID,
    "type" "MentorNoteType" NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MentorNote_userId_archivedAt_pinned_createdAt_idx"
ON "MentorNote"("userId", "archivedAt", "pinned", "createdAt");

CREATE INDEX "MentorNote_mentorId_createdAt_idx"
ON "MentorNote"("mentorId", "createdAt");

CREATE INDEX "MentorNote_conversationId_idx"
ON "MentorNote"("conversationId");

ALTER TABLE "MentorNote"
ADD CONSTRAINT "MentorNote_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentorNote"
ADD CONSTRAINT "MentorNote_mentorId_fkey"
FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MentorNote"
ADD CONSTRAINT "MentorNote_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- MentorAndI application data is server-only. Protect this new table at creation
-- time so a deployment never leaves it browser-readable between migration and
-- any later security-hardening pass.
ALTER TABLE "MentorNote" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "MentorNote" FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "MentorNote" FROM authenticated;
  END IF;
END $$;
