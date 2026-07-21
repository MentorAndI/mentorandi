import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AlphaInviteService,
  AlphaInviteServiceError,
} from "@/services/alpha-invite/alpha-invite.service";
import type { ValidatedAlphaInvite } from "@/services/alpha-invite/alpha-invite.types";
import {
  buildAuthCallbackUrl,
  getPublicAppOrigin,
  normalizeSafeAuthNextPath,
} from "@/services/auth/redirects";
import { UserService } from "@/services/user/user.service";

export interface AlphaSignupInput {
  email: string;
  inviteCode?: string;
  nextPath?: string;
  password: string;
  requestOrigin: string;
}

export class AlphaSignupServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AlphaSignupServiceError";
  }
}

export class AlphaSignupService {
  constructor(
    private readonly inviteService = new AlphaInviteService(),
    private readonly userService = new UserService(),
  ) {}

  async signup(input: AlphaSignupInput) {
    const email = input.email.trim();
    const password = input.password;

    if (!email || !password) {
      throw new AlphaSignupServiceError(
        "Email and password are required.",
        400,
      );
    }

    let validatedInvite: ValidatedAlphaInvite;

    try {
      validatedInvite = await this.inviteService.validateForSignup(
        input.inviteCode,
        email,
      );
    } catch (error) {
      throw translateInviteError(error);
    }

    const supabase = await createSupabaseServerClient();
    const publicOrigin = getPublicAppOrigin(input.requestOrigin);
    const nextPath = normalizeSafeAuthNextPath(input.nextPath);
    const { data, error } = await supabase.auth.signUp({
      email,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(publicOrigin, nextPath),
      },
      password,
    });

    if (error) {
      throw new AlphaSignupServiceError(
        formatSafeSignupError(error.message),
        400,
      );
    }

    if (
      !data.user ||
      (Array.isArray(data.user.identities) && data.user.identities.length === 0)
    ) {
      throw new AlphaSignupServiceError(
        "Signup failed. Please check your information and try again.",
        400,
      );
    }

    const appUser = await this.userService.getOrCreateUserByAuthUserId(
      data.user.id,
    );
    try {
      await this.inviteService.consumeAfterSignup(validatedInvite, appUser.id);
    } catch (error) {
      throw translateInviteError(error);
    }

    return {
      confirmationRequired: !data.session,
      hasSession: Boolean(data.session),
    };
  }
}

function translateInviteError(error: unknown) {
  if (error instanceof AlphaInviteServiceError) {
    return new AlphaSignupServiceError(error.message, error.statusCode);
  }

  return error;
}

function formatSafeSignupError(message?: string) {
  const safeMessage = (message ?? "")
    .replace(
      /\b(access_token|refresh_token|token|code)=([^&\s]+)/gi,
      "$1=[redacted]",
    )
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[redacted]",
    )
    .replace(/\b[A-Za-z0-9_-]{48,}\b/g, "[redacted]")
    .trim()
    .slice(0, 500);

  return safeMessage
    ? `Signup failed: ${safeMessage}`
    : "Signup failed. Please check your information and try again.";
}
