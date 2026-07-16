import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminAccessResult =
  | { status: "allowed"; email: string }
  | { status: "forbidden"; email: string | null }
  | { status: "unauthenticated" };

export class AdminAuthService {
  async resolveAdminAccess(): Promise<AdminAccessResult> {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { status: "unauthenticated" };
    }

    const email = normalizeEmail(user.email);
    const adminEmails = getAlphaAdminEmails();

    if (!email || !adminEmails.has(email)) {
      return { email, status: "forbidden" };
    }

    return { email, status: "allowed" };
  }
}

function getAlphaAdminEmails() {
  return new Set(
    (process.env.ALPHA_ADMIN_EMAILS ?? "")
      .split(",")
      .map(normalizeEmail)
      .filter((email): email is string => Boolean(email)),
  );
}

function normalizeEmail(email: string | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();

  return normalizedEmail || null;
}
