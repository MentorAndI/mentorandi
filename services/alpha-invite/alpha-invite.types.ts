export type AlphaInviteStatus = "active" | "expired" | "revoked" | "used";

export interface CreateAlphaInviteInput {
  email?: string;
  expiresAt?: string;
  maxUses?: number;
  note?: string;
}

export interface AlphaInviteAdminDto {
  codePreview: string;
  createdAt: string;
  email: string | null;
  expiresAt: string | null;
  id: string;
  maxUses: number;
  note: string | null;
  revokedAt: string | null;
  status: AlphaInviteStatus;
  useCount: number;
  usedAt: string | null;
}

export type ValidatedAlphaInvite =
  | { kind: "database"; inviteId: string; useCount: number }
  | { kind: "environment-fallback" };
