-- CreateTable
CREATE TABLE "AlphaInvite" (
    "id" UUID NOT NULL,
    "codeHash" VARCHAR(64) NOT NULL,
    "codePreview" VARCHAR(32) NOT NULL,
    "email" VARCHAR(320),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "usedByUserId" UUID,
    "revokedAt" TIMESTAMP(3),
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,

    CONSTRAINT "AlphaInvite_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AlphaInvite_maxUses_check" CHECK ("maxUses" > 0),
    CONSTRAINT "AlphaInvite_useCount_check" CHECK ("useCount" >= 0 AND "useCount" <= "maxUses")
);

-- CreateIndex
CREATE UNIQUE INDEX "AlphaInvite_codeHash_key" ON "AlphaInvite"("codeHash");
CREATE INDEX "AlphaInvite_createdAt_idx" ON "AlphaInvite"("createdAt");
CREATE INDEX "AlphaInvite_email_idx" ON "AlphaInvite"("email");
CREATE INDEX "AlphaInvite_expiresAt_idx" ON "AlphaInvite"("expiresAt");
CREATE INDEX "AlphaInvite_revokedAt_idx" ON "AlphaInvite"("revokedAt");
CREATE INDEX "AlphaInvite_usedByUserId_idx" ON "AlphaInvite"("usedByUserId");

-- AddForeignKey
ALTER TABLE "AlphaInvite" ADD CONSTRAINT "AlphaInvite_usedByUserId_fkey" FOREIGN KEY ("usedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Invite records and hashes are server-side administrative data only.
ALTER TABLE public."AlphaInvite" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE public."AlphaInvite" FROM anon;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE public."AlphaInvite" FROM authenticated;
    END IF;
END $$;
