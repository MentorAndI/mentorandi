import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { SubscriptionActivationWaiter } from "@/components/billing/SubscriptionActivationWaiter";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { BillingAccessService } from "@/services/billing/billing-access.service";
import { paymentsAvailable } from "@/services/billing/billing.service";
import {
  getPaidPlanDetails,
  normalizeRequestedPlan,
} from "@/services/billing/purchase-flow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm your plan | Mentor And I",
  description: "Confirm your Mentor And I plan before secure payment.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{
    checkout?: string | string[];
    plan?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const requestedPlanValue = Array.isArray(params.plan)
    ? params.plan[0]
    : params.plan;
  const checkoutValue = Array.isArray(params.checkout)
    ? params.checkout[0]
    : params.checkout;
  const requestedPlan = normalizeRequestedPlan(requestedPlanValue);
  const planDetails = getPaidPlanDetails(requestedPlan);
  const purchaseStatus =
    await new BillingAccessService().getCurrentPurchaseStatus();

  if (purchaseStatus.hasActivePaidSubscription) {
    redirect("/mentors");
  }

  return (
    <main className="min-h-screen bg-[var(--app-bg)] py-10 text-[var(--ink)] sm:py-16">
      <Container className="max-w-3xl">
        <p className="mb-5 font-serif text-xl font-medium tracking-[-0.02em] text-[var(--ink)]">
          Mentor <span className="text-[var(--terra-text)]">And I</span>
        </p>

        <div className="rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--surface-raised)] p-7 shadow-[var(--shadow-md)] sm:p-10">
          {planDetails ? (
            checkoutValue === "returned" ? (
              <SubscriptionActivationWaiter plan={planDetails.publicPlan} />
            ) : (
              <>
                <Badge variant="muted">Plan confirmation</Badge>
                <Heading className="mt-5" level={1}>
                  {planDetails.name}
                </Heading>
                <Text className="mt-3 text-lg leading-8">
                  Confirm your plan, then continue to Stripe for secure payment.
                  Mentor selection comes next.
                </Text>

                <section className="mt-8 rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--band)] p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--ink)]">
                        {planDetails.name}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                        {planDetails.summary}
                      </p>
                    </div>
                    <p className="shrink-0 text-2xl font-semibold text-[var(--ink)]">
                      ${planDetails.monthlyPrice}
                      <span className="text-sm font-medium text-[var(--ink-muted)]">
                        /month
                      </span>
                    </p>
                  </div>
                  <div className="mt-5 rounded-[var(--r-md)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--ink-muted)]">
                    <span className="font-semibold text-[var(--ink)]">
                      {planDetails.monthlyCredits.toLocaleString("en-US")}
                    </span>{" "}
                    credits each month
                  </div>
                </section>

                <div className="mt-6 flex flex-col items-start gap-4">
                  <CheckoutButton
                    enabled={paymentsAvailable()}
                    plan={planDetails.checkoutPlan}
                  />
                  <Link
                    className="text-sm font-semibold text-[var(--terra-text)] underline decoration-[var(--line-strong)] underline-offset-4"
                    href="/pricing"
                  >
                    Change plan
                  </Link>
                </div>

                <p className="mt-6 text-xs leading-5 text-[var(--ink-faint)]">
                  Access is activated only after Mentor And I verifies the
                  Stripe subscription.
                </p>
              </>
            )
          ) : (
            <>
              <Badge variant="muted">Free Trial</Badge>
              <Heading className="mt-5" level={1}>
                Ready to choose your mentor
              </Heading>
              <Text className="mt-4 text-lg leading-8">
                No payment is needed for the trial. Continue to mentor selection
                and begin your first conversation.
              </Text>
              <Link
                className="mt-8 inline-flex h-11 items-center justify-center rounded-[var(--r-md)] bg-[var(--terra-hover)] px-5 text-sm font-semibold text-[var(--on-terra)] transition hover:bg-[var(--terra-press)]"
                href="/mentors"
              >
                Choose a mentor
              </Link>
            </>
          )}
        </div>
      </Container>
    </main>
  );
}
