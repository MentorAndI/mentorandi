import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface EmailPasswordCredentials {
  email: string;
  password: string;
}

export async function signInWithEmailPassword({
  email,
  password,
}: EmailPasswordCredentials) {
  const supabase = createSupabaseBrowserClient();

  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export interface SignupCredentials extends EmailPasswordCredentials {
  emailRedirectTo?: string;
}

export async function signUpWithEmailPassword({
  email,
  emailRedirectTo,
  password,
}: SignupCredentials) {
  const supabase = createSupabaseBrowserClient();

  return supabase.auth.signUp({
    email,
    options: emailRedirectTo
      ? {
          emailRedirectTo,
        }
      : undefined,
    password,
  });
}

export async function requestPasswordReset(email: string, redirectTo: string) {
  const supabase = createSupabaseBrowserClient();

  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
}

export async function signOutCurrentUser() {
  const supabase = createSupabaseBrowserClient();

  const response = await fetch("/api/auth/sign-out", {
    headers: {
      Accept: "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to sign out.");
  }

  await supabase.auth.signOut();
}

export async function syncCurrentUser() {
  const response = await fetch("/api/me", {
    headers: {
      Accept: "application/json",
    },
    method: "GET",
  });

  if (!response.ok) {
    const responseBody = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    throw new Error(responseBody?.error ?? "Unable to resolve current user.");
  }
}
