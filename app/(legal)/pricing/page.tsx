import type { Metadata } from "next";

import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { paymentsAvailable } from "@/services/billing/billing.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing | Mentor And I",
  description: "Planned Mentor And I access options after the private alpha.",
};

const plans = [
  {
    description: "Current no-charge access for external alpha testers.",
    features: ["Email verification required", "Alpha usage limits", "Feedback helps shape the product"],
    name: "Alpha",
    plan: null,
  },
  {
    description: "Planned monthly access for ongoing personal mentoring.",
    features: ["Persistent mentor history", "Specialized mentor profiles", "Higher limits than alpha"],
    name: "Personal",
    plan: "PERSONAL" as const,
  },
  {
    description: "Planned monthly access for more frequent and deeper mentoring.",
    features: ["Everything in Personal", "Higher overall limits", "Higher deep-route allowance"],
    name: "Premium",
    plan: "PREMIUM" as const,
  },
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const enabled = paymentsAvailable();
  const billing = (await searchParams).billing;

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-emerald-50 py-16 text-zinc-950">
      <Container>
        {billing === "canceled" ? (
          <div className="mx-auto mb-8 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
            Test checkout was canceled. No charge or subscription change was made.
          </div>
        ) : null}
        <div className="mx-auto max-w-3xl text-center">
          <Badge>{enabled ? "Stripe test mode" : "Private alpha"}</Badge>
          <Heading className="mt-5" level={1}>Simple access, built for an ongoing mentor relationship</Heading>
          <Text className="mx-auto mt-4 max-w-2xl text-lg">
            Mentor And I currently accepts external alpha tester signups.
            Personal and Premium are planned paid tiers; final pricing and
            availability will be set before launch.
          </Text>
          {!enabled ? (
            <p className="mt-4 text-sm font-medium text-amber-800">
              Payments are not enabled yet. Alpha access continues without payment.
            </p>
          ) : (
            <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-950">
              Test mode only. Use Stripe test payment details—no real customer
              will be charged from this staging flow.
            </div>
          )}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <section className="flex rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm" key={plan.name}>
              <div className="flex w-full flex-col">
                <Heading level={2}>{plan.name}</Heading>
                <Text className="mt-3">{plan.description}</Text>
                <p className="mt-5 text-sm font-semibold text-zinc-900">
                  {plan.plan ? "Monthly price to be confirmed" : "No charge during alpha"}
                </p>
                <ul className="my-6 space-y-3 text-sm text-zinc-700">
                  {plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
                </ul>
                <div className="mt-auto">
                  {plan.plan ? (
                    <CheckoutButton enabled={enabled} plan={plan.plan} />
                  ) : (
                    <a className="block rounded-xl border border-zinc-300 px-4 py-3 text-center text-sm font-semibold text-zinc-800 hover:bg-zinc-50" href="/alpha">
                      Learn about the alpha
                    </a>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>

        <Text className="mx-auto mt-10 max-w-3xl text-center text-sm" variant="muted">
          This page describes planned access, not a promise of final features or
          pricing. Checkout appears only when the billing configuration is enabled.
        </Text>
      </Container>
    </main>
  );
}
