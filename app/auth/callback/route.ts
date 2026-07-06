import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getPublicAppOrigin,
  normalizeSafeAuthNextPath,
} from "@/services/auth/redirects";
import { UserService } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

const supportedOtpTypes = new Set<EmailOtpType>([
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
  "signup",
]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const publicAppOrigin = getPublicAppOrigin(requestUrl.origin);
  const nextPath = normalizeSafeAuthNextPath(
    requestUrl.searchParams.get("next"),
  );
  const redirectUrl = new URL(nextPath, publicAppOrigin);
  const errorUrl = new URL("/login", publicAppOrigin);

  errorUrl.searchParams.set("error", "auth_callback_failed");

  const supabase = await createSupabaseServerClient();
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = parseOtpType(requestUrl.searchParams.get("type"));

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return NextResponse.redirect(errorUrl);
    }

    await new UserService().getOrCreateUserByAuthUserId(data.user.id);

    return NextResponse.redirect(redirectUrl);
  }

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error || !data.user) {
      return NextResponse.redirect(errorUrl);
    }

    await new UserService().getOrCreateUserByAuthUserId(data.user.id);

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(errorUrl);
}

function parseOtpType(value: string | null): EmailOtpType | null {
  if (!value || !supportedOtpTypes.has(value as EmailOtpType)) {
    return null;
  }

  return value as EmailOtpType;
}
