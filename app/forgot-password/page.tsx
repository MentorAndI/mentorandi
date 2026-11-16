import Link from "next/link";
import type { Metadata } from "next";

import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { PublicSiteNavigation } from "@/components/navigation/PublicSiteNavigation";

export const metadata: Metadata = {
  title: "Forgot password | Mentor And I",
  description: "Request a Mentor And I password reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--ink)]">
      <PublicSiteNavigation />

      <main className="flex min-h-screen items-center justify-center px-6 pb-16 pt-28">
        <AuthFormShell
          description="Enter your email and we will send instructions for resetting your password."
          title="Reset your password"
        >
          <ForgotPasswordForm />
          <p className="text-center text-sm text-[var(--ink-muted)]">
            Remember your password?{" "}
            <Link
              className="font-medium text-[var(--ink)] underline underline-offset-4"
              href="/login"
            >
              Log in
            </Link>
          </p>
        </AuthFormShell>
      </main>
    </div>
  );
}
