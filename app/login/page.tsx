import type { Metadata } from "next";

import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSafeAuthRedirectPath } from "@/services/auth/redirects";

export const metadata: Metadata = {
  title: "Log in | Mentor And I",
  description: "Log in to Mentor And I.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedPath = Array.isArray(params.next) ? params.next[0] : params.next;
  const redirectPath = getSafeAuthRedirectPath(
    requestedPath ?? null,
    "/onboarding",
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-950">
      <AuthFormShell
        description="Welcome back. Sign in to continue with Marcus, or choose a specialized mentor from the mentor screen."
        footerLink={{
          href: "/signup",
          label: "Create an account",
          text: "New to Mentor And I?",
        }}
        title="Log in"
      >
        <LoginForm redirectPath={redirectPath} />
      </AuthFormShell>
    </main>
  );
}
