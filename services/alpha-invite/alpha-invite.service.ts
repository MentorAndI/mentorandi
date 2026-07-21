import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { AlphaInviteRepository } from "@/services/alpha-invite/alpha-invite.repository";
import type {
  AlphaInviteAdminDto,
  CreateAlphaInviteInput,
  ValidatedAlphaInvite,
} from "@/services/alpha-invite/alpha-invite.types";

const recentInviteLimit = 100;
const maximumUsesLimit = 100;

export class AlphaInviteServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AlphaInviteServiceError";
  }
}

export class AlphaInviteService {
  constructor(private readonly repository = new AlphaInviteRepository()) {}

  async validateForSignup(
    submittedCode: string | undefined,
    submittedEmail: string,
  ): Promise<ValidatedAlphaInvite> {
    const code = submittedCode?.trim() ?? "";

    if (!code) {
      throw invalidInviteError();
    }

    try {
      const invite = await this.repository.findByCodeHash(hashInviteCode(code));

      if (invite) {
        if (
          invite.revokedAt ||
          (invite.expiresAt && invite.expiresAt <= new Date())
        ) {
          throw invalidInviteError();
        }

        if (invite.useCount >= invite.maxUses) {
          throw new AlphaInviteServiceError(
            "This alpha invite has already been used.",
            403,
          );
        }

        if (invite.email && invite.email !== normalizeEmail(submittedEmail)) {
          throw new AlphaInviteServiceError(
            "This alpha invite does not match that email address.",
            403,
          );
        }

        return {
          inviteId: invite.id,
          kind: "database",
          useCount: invite.useCount,
        };
      }
    } catch (error) {
      if (error instanceof AlphaInviteServiceError) {
        throw error;
      }

      if (isEnvironmentFallbackCode(code)) {
        return { kind: "environment-fallback" };
      }

      throw new AlphaInviteServiceError(
        "Invite validation is temporarily unavailable. Please try again.",
        503,
      );
    }

    if (isEnvironmentFallbackCode(code)) {
      return { kind: "environment-fallback" };
    }

    throw invalidInviteError();
  }

  async consumeAfterSignup(
    validatedInvite: ValidatedAlphaInvite,
    usedByUserId: string,
  ) {
    if (validatedInvite.kind === "environment-fallback") {
      return;
    }

    const consumed = await this.repository.consume({
      inviteId: validatedInvite.inviteId,
      previousUseCount: validatedInvite.useCount,
      usedByUserId,
    });

    if (!consumed) {
      throw new AlphaInviteServiceError(
        "This alpha invite is no longer available.",
        409,
      );
    }
  }

  async createInvite(input: CreateAlphaInviteInput) {
    const email = normalizeOptionalEmail(input.email);
    const expiresAt = parseExpiry(input.expiresAt);
    const maxUses = parseMaxUses(input.maxUses);
    const note = normalizeNote(input.note);
    const rawCode = `MAI-${randomBytes(18).toString("base64url")}`;

    const invite = await this.repository.create({
      codeHash: hashInviteCode(rawCode),
      codePreview: buildCodePreview(rawCode),
      email,
      expiresAt,
      maxUses,
      note,
    });

    return { code: rawCode, invite: toAdminDto(invite) };
  }

  async listRecentInvites(): Promise<AlphaInviteAdminDto[]> {
    const invites = await this.repository.listRecent(recentInviteLimit);
    return invites.map(toAdminDto);
  }

  async revokeInvite(inviteId: string) {
    if (!isUuid(inviteId)) {
      throw new AlphaInviteServiceError("Invite was not found.", 404);
    }

    const revoked = await this.repository.revoke(inviteId);

    if (!revoked) {
      throw new AlphaInviteServiceError(
        "Invite was not found or is already revoked.",
        404,
      );
    }
  }
}

function hashInviteCode(code: string) {
  return createHash("sha256").update(code, "utf8").digest("hex");
}

function buildCodePreview(code: string) {
  return `${code.slice(0, 8)}…${code.slice(-4)}`;
}

function isEnvironmentFallbackCode(code: string) {
  const fallbackCode = process.env.ALPHA_INVITE_CODE?.trim();

  if (!fallbackCode) {
    return false;
  }

  const submitted = Buffer.from(code, "utf8");
  const configured = Buffer.from(fallbackCode, "utf8");

  return submitted.length === configured.length && timingSafeEqual(submitted, configured);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeOptionalEmail(email?: string) {
  const normalized = normalizeEmail(email ?? "");

  if (!normalized) {
    return null;
  }

  if (
    normalized.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    throw new AlphaInviteServiceError("Enter a valid restricted email.", 400);
  }

  return normalized;
}

function parseExpiry(value?: string) {
  if (!value?.trim()) {
    return null;
  }

  const expiry = new Date(value);

  if (Number.isNaN(expiry.getTime()) || expiry <= new Date()) {
    throw new AlphaInviteServiceError("Expiry must be a future date.", 400);
  }

  return expiry;
}

function parseMaxUses(value?: number) {
  const maxUses = value ?? 1;

  if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > maximumUsesLimit) {
    throw new AlphaInviteServiceError(
      `Max uses must be between 1 and ${maximumUsesLimit}.`,
      400,
    );
  }

  return maxUses;
}

function normalizeNote(note?: string) {
  const normalized = note?.trim() ?? "";

  if (normalized.length > 500) {
    throw new AlphaInviteServiceError(
      "Note must be 500 characters or fewer.",
      400,
    );
  }

  return normalized || null;
}

function toAdminDto(invite: {
  codePreview: string;
  createdAt: Date;
  email: string | null;
  expiresAt: Date | null;
  id: string;
  maxUses: number;
  note: string | null;
  revokedAt: Date | null;
  useCount: number;
  usedAt: Date | null;
}): AlphaInviteAdminDto {
  const now = new Date();
  const status = invite.revokedAt
    ? "revoked"
    : invite.expiresAt && invite.expiresAt <= now
      ? "expired"
      : invite.useCount >= invite.maxUses
        ? "used"
        : "active";

  return {
    codePreview: invite.codePreview,
    createdAt: invite.createdAt.toISOString(),
    email: invite.email,
    expiresAt: invite.expiresAt?.toISOString() ?? null,
    id: invite.id,
    maxUses: invite.maxUses,
    note: invite.note,
    revokedAt: invite.revokedAt?.toISOString() ?? null,
    status,
    useCount: invite.useCount,
    usedAt: invite.usedAt?.toISOString() ?? null,
  };
}

function invalidInviteError() {
  return new AlphaInviteServiceError("Invalid or expired alpha invite.", 403);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
