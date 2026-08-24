import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildAuthCallbackUrl,
  getPublicAppOrigin,
} from "@/services/auth/redirects";
import { validateAgeConfirmation } from "@/services/auth/validation";
import { UserService } from "@/services/user/user.service";

export interface AlphaSignupInput {
  ageConfirmed: boolean;
  email: string;
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
  constructor(private readonly userService = new UserService()) {}

  async signup(input: AlphaSignupInput) {
    const email = input.email.trim();
    const password = input.password;
    const ageConfirmationError = validateAgeConfirmation(input.ageConfirmed);

    if (!email || !password) {
      throw new AlphaSignupServiceError(
        "Email and password are required.",
        400,
      );
    }

    if (ageConfirmationError) {
      throw new AlphaSignupServiceError(ageConfirmationError, 400);
    }

    const supabase = await createSupabaseServerClient();
    const publicOrigin = getPublicAppOrigin(input.requestOrigin);
    const ageConfirmedAt = new Date().toISOString();
    const { data, error } = await supabase.auth.signUp({
      email,
      options: {
        data: {
          age_confirmed_18_plus: true,
          age_confirmed_at: ageConfirmedAt,
        },
        emailRedirectTo: buildAuthCallbackUrl(publicOrigin, input.nextPath),
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

    await this.userService.getOrCreateUserByAuthUserId(data.user.id);

    return {
      confirmationRequired: !data.session,
      hasSession: Boolean(data.session),
    };
  }
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