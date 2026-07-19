import type { Metadata } from "next";

import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign up | MentorAndI",
  description: "Create a MentorAndI account.",
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-950">
      <AuthFormShell
        description="MentorAndI is currently in private alpha. Enter your invite code to create an account."
        footerLink={{
          href: "/login",
          label: "Log in",
          text: "Already have an account?",
        }}
        title="Create your account"
      >
        <SignupForm />
      </AuthFormShell>
    </main>
  );
}
