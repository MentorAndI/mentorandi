import type { Metadata } from "next";
import Link from "next/link";

import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { paymentsAvailable } from "@/services/billing/billing.service";
import type { PurchasablePlan } from "@/services/billing/billing.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Onboarding | Mentor And I",
  description: "Start your Mentor And I onboarding.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedPlanValue = Array.isArray(params.plan)
    ? params.plan[0]
    : params.plan;
  const requestedPlan = normalizeRequestedPlan(requestedPlanValue);
  const checkoutPlan = toCheckoutPlan(requestedPlan);

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-sky-50 py-16 text-zinc-950">
      <Container className="max-w-3xl">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-12">
          <Badge variant="muted">Your first step</Badge>
          <Heading className="mt-5" level={1}>
            Let’s find the right place to begin
          </Heading>
          <Text className="mt-5 text-lg leading-8">
            New accounts can begin on the Free Trial with Life Mentor access,
            or activate the paid plan selected on mentorandi.com.
          </Text>

          {checkoutPlan ? (
            <div className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <div>
                <p className="font-semibold text-zinc-950">
                  Your selected plan is ready
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Payment is handled securely by Stripe. Paid mentor access is
                  activated only after Mentor And I receives a verified Stripe
                  subscription event.
                </p>
              </div>
              <CheckoutButton
                enabled={paymentsAvailable()}
                plan={checkoutPlan}
              />
              <Link
                className="inline-flex text-sm font-semibold text-sky-950 underline underline-offset-4"
                href="/mentors"
              >
                Continue with the Free Trial instead
              </Link>
            </div>
          ) : (
            <div className="mt-8">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-lg bg-sky-950 px-6 text-sm font-semibold text-white transition hover:bg-sky-900"
                href="/mentors"
              >
                Continue to mentor selection
              </Link>
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}

function normalizeRequestedPlan(value?: string) {
  if (!value || !["free", "single", "plus", "premium"].includes(value)) {
    return "free" as const;
  }

  return value as "free" | "single" | "plus" | "premium";
}

function toCheckoutPlan(
  plan: "free" | "single" | "plus" | "premium",
): PurchasablePlan | null {
  switch (plan) {
    case "single":
      return "SINGLE";
    case "plus":
      return "PLUS";
    case "premium":
      return "PREMIUM";
    case "free":
      return null;
  }
}
