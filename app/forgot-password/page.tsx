import Link from "next/link";
import type { Metadata } from "next";

import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password | Mentor And I",
  description: "Request a Mentor And I password reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-[var(--surface-raised)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <a
            className="shrink-0 font-serif text-xl font-medium tracking-[-0.02em] text-[var(--ink)]"
            href="https://mentorandi.com"
          >
            Mentor <span className="text-[var(--terra-text)]">And I</span>
          </a>

          <nav
            aria-label="Account navigation"
            className="flex items-center gap-4 text-sm font-semibold"
          >
            <Link
              className="text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
              href="/login"
            >
              Log in
            </Link>
            <Link
              className="rounded-full bg-[var(--terra)] px-4 py-2 text-white transition-colors hover:bg-[var(--terra-deep)]"
              href="/signup?plan=free"
            >
              Create account
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-16">
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
