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

export async function signUpWithEmailPassword({
  email,
  password,
}: EmailPasswordCredentials) {
  const supabase = createSupabaseBrowserClient();

  return supabase.auth.signUp({
    email,
    password,
  });
}

export async function requestPasswordReset(email: string, redirectTo: string) {
  const supabase = createSupabaseBrowserClient();

  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
}
