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
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-sky-50 py-16 text-zinc-950">
      <Container className="max-w-3xl">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-12">
          {planDetails ? (
            checkoutValue === "returned" ? (
              <SubscriptionActivationWaiter plan={planDetails.publicPlan} />
            ) : (
              <>
                <Badge variant="muted">Payment confirmation</Badge>
                <Heading className="mt-5" level={1}>
                  Confirm {planDetails.name}
                </Heading>
                <Text className="mt-4 text-lg leading-8">
                  Review your plan, then continue to Stripe for secure payment.
                  You’ll choose your mentor after your subscription is verified.
                </Text>

                <section className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-zinc-950">
                        {planDetails.name}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-zinc-700">
                        {planDetails.summary}
                      </p>
                    </div>
                    <p className="shrink-0 text-2xl font-semibold text-zinc-950">
                      ${planDetails.monthlyPrice}
                      <span className="text-sm font-medium text-zinc-600">
                        /month
                      </span>
                    </p>
                  </div>
                  <div className="mt-5 rounded-xl bg-white px-4 py-3 text-sm text-zinc-800">
                    <span className="font-semibold">
                      {planDetails.monthlyCredits.toLocaleString("en-US")}
                    </span>{" "}
                    Mentor Credits each month
                  </div>
                </section>

                <div className="mt-6 space-y-4">
                  <CheckoutButton
                    enabled={paymentsAvailable()}
                    plan={planDetails.checkoutPlan}
                  />
                  <Link
                    className="inline-flex text-sm font-semibold text-sky-950 underline underline-offset-4"
                    href="/pricing"
                  >
                    Change plan
                  </Link>
                </div>

                <p className="mt-6 text-xs leading-5 text-zinc-500">
                  Access begins only after Mentor And I verifies your active
                  Stripe subscription. This page does not grant entitlement.
                </p>
              </>
            )
          ) : (
            <>
              <Badge variant="muted">Free Trial</Badge>
              <Heading className="mt-5" level={1}>
                Choose your mentor
              </Heading>
              <Text className="mt-5 text-lg leading-8">
                No payment is needed. Continue to mentor selection, answer a
                short opening question, and begin your first conversation.
              </Text>
              <Link
                className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-sky-950 px-6 text-sm font-semibold text-white transition hover:bg-sky-900"
                href="/mentors"
              >
                Continue to mentor selection
              </Link>
            </>
          )}
        </div>
      </Container>
    </main>
  );
}
