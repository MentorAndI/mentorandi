import { timingSafeEqual } from "node:crypto";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildAuthCallbackUrl,
  getPublicAppOrigin,
  normalizeSafeAuthNextPath,
} from "@/services/auth/redirects";

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
  async signup(input: AlphaSignupInput) {
    if (!isValidAlphaInviteCode(input.inviteCode)) {
      throw new AlphaSignupServiceError("Invalid alpha invite code.", 403);
    }

    const email = input.email.trim();
    const password = input.password;

    if (!email || !password) {
      throw new AlphaSignupServiceError(
        "Email and password are required.",
        400,
      );
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

    return {
      confirmationRequired: !data.session,
      hasSession: Boolean(data.session),
    };
  }
}

function isValidAlphaInviteCode(submittedCode?: string) {
  const configuredCode = process.env.ALPHA_INVITE_CODE?.trim();

  if (!configuredCode) {
    return true;
  }

  const submittedBuffer = Buffer.from(submittedCode?.trim() ?? "", "utf8");
  const configuredBuffer = Buffer.from(configuredCode, "utf8");

  return (
    submittedBuffer.length === configuredBuffer.length &&
    timingSafeEqual(submittedBuffer, configuredBuffer)
  );
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
