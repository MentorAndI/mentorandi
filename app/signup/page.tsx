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
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-950">
      <AuthFormShell
        description="Create your account, verify your email, and continue to onboarding."
        footerLink={{
          href: buildLoginPath(redirectPath),
          label: "Log in",
          text: "Already have an account?",
        }}
        title="Create your account"
      >
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
          After signup, check your inbox for the verification link. It will
          bring you back to Mentor And I and continue to your first step.
        </div>
        <SignupForm redirectPath={redirectPath} />
      </AuthFormShell>
    </main>
  );
}
