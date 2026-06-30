import Link from "next/link";
import type { Metadata } from "next";

import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password | MentorAndI",
  description: "Request a MentorAndI password reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-950">
      <AuthFormShell
        description="Enter your email and we will send instructions for resetting your password."
        title="Reset your password"
      >
        <ForgotPasswordForm />
        <p className="text-center text-sm text-zinc-600">
          Remember your password?{" "}
          <Link
            className="font-medium text-zinc-950 underline underline-offset-4"
            href="/login"
          >
            Log in
          </Link>
        </p>
      </AuthFormShell>
    </main>
  );
}
