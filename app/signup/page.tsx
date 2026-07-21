import type { Metadata } from "next";

import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { normalizeSafeAuthNextPath } from "@/services/auth/redirects";

export const metadata: Metadata = {
  title: "Sign up | MentorAndI",
  description: "Create a MentorAndI account.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedPath = Array.isArray(params.next) ? params.next[0] : params.next;
  const redirectPath = normalizeSafeAuthNextPath(requestedPath ?? "/mentors");

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-950">
      <AuthFormShell
        description="MentorAndI is a private alpha for invited testers. Use your invite code, verify your email, then choose the mentor closest to what you want help with."
        footerLink={{
          href: "/login",
          label: "Log in",
          text: "Already have an account?",
        }}
        title="Create your account"
      >
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
          After signup, check your inbox for the verification link. It will
          bring you back to MentorAndI and continue to your first step.
        </div>
        <SignupForm redirectPath={redirectPath} />
      </AuthFormShell>
    </main>
  );
}
