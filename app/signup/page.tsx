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
        description="Create an account to keep your mentoring journey private and available across sessions."
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
