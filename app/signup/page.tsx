import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { SignupForm } from "@/components/auth/SignupForm";
import {
  buildLoginPath,
  normalizeSafeAuthNextPath,
} from "@/services/auth/redirects";
import { BillingAccessService } from "@/services/billing/billing-access.service";
import { buildOnboardingPath } from "@/services/billing/purchase-flow";

export const metadata: Metadata = {
  title: "Sign up | Mentor And I",
  description: "Create a Mentor And I account.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    plan?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const requestedPath = Array.isArray(params.next) ? params.next[0] : params.next;
  const requestedPlan = Array.isArray(params.plan) ? params.plan[0] : params.plan;
  const onboardingPath = buildOnboardingPath(requestedPlan);
  const redirectPath = normalizeSafeAuthNextPath(requestedPath ?? onboardingPath);
  const purchaseStatus =
    await new BillingAccessService().getCurrentPurchaseStatus();

  if (purchaseStatus.hasActivePaidSubscription) {
    redirect("/mentors");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-6 py-16 text-[var(--ink)]">
      <AuthFormShell
        description="Create your account to continue into Mentor And I."
        footerLink={{
          href: buildLoginPath(redirectPath),
          label: "Log in",
          text: "Already have an account?",
        }}
        title="Create your account"
      >
        <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--band)] p-4 text-sm leading-6 text-[var(--ink-muted)]">
          After signup, use the verification link in your inbox to continue.
        </div>
        <SignupForm redirectPath={redirectPath} />
      </AuthFormShell>
    </main>
  );
}
