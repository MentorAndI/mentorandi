import type { Metadata } from "next";

import { AccountDataControls } from "@/components/account/AccountDataControls";
import { AccountNavigation } from "@/components/auth/AccountNavigation";
import { BillingPortalButton } from "@/components/billing/BillingPortalButton";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { paymentsAvailable } from "@/services/billing/billing.service";
import { CreditService } from "@/services/credits/credit.service";
import { UserService } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings | Mentor And I",
  description: "Manage your Mentor And I account and billing.",
};

const appLinks = [
  { href: "/mentor", label: "Mentor" },
  { href: "/mentors", label: "Mentors" },
  { href: "/credits", label: "Credits" },
  { href: "/settings", label: "Settings" },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const billing = (await searchParams).billing;
  const user = await new UserService().resolveCurrentUser();
  const creditBalance = await new CreditService().getBalanceForUser(user.id);

  return (
    <main className="min-h-screen bg-[var(--app-bg)] py-4 text-[var(--ink)] sm:py-6">
      <Container className="max-w-6xl">
        <AccountNavigation links={appLinks} />

        {billing === "success" ? (
          <div className="mb-6 rounded-[var(--r-md)] border border-[color-mix(in_srgb,var(--success)_35%,var(--line))] bg-[color-mix(in_srgb,var(--success)_9%,var(--surface))] px-4 py-3 text-sm text-[var(--ink)]">
            Checkout returned successfully. Subscription access is applied only
            after Mentor And I receives and verifies the Stripe webhook.
          </div>
        ) : null}

        <div className="mb-8 max-w-2xl">
          <p className="font-meta text-[0.7rem] text-[var(--terra-text)]">
            ACCOUNT
          </p>
          <Heading className="mt-2" level={1}>
            Settings
          </Heading>
          <Text className="mt-3 leading-7">
            Manage your account data, credits, subscription and payment details.
          </Text>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-[var(--ink)]">
                Account data
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--ink-muted)]">
                Export your Mentor And I data or delete your mentor data.
              </p>
            </div>
            <AccountDataControls />
          </section>

          <div className="space-y-6">
            <Card className="p-6" variant="bordered">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between lg:flex-col xl:flex-row">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--ink)]">
                    Credits
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                    Plan credits are used first. Purchased top-up credits stay
                    available until used.
                  </p>
                </div>
                <Button href="/credits" size="sm">
                  Buy credits
                </Button>
              </div>
              <dl className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <CreditBalanceItem
                  label="Total"
                  value={creditBalance.balance}
                />
                <CreditBalanceItem
                  label="Plan"
                  value={creditBalance.planBalance}
                />
                <CreditBalanceItem
                  label="Top-up"
                  value={creditBalance.topUpBalance}
                />
              </dl>
            </Card>

            <section>
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-[var(--ink)]">
                  Plan and billing
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--ink-muted)]">
                  Manage your subscription, payment method and invoices securely
                  through Stripe.
                </p>
              </div>
              <BillingPortalButton enabled={paymentsAvailable()} />
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}

function CreditBalanceItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--r-md)] bg-[var(--band)] p-3">
      <dt className="font-meta text-[0.65rem] text-[var(--ink-faint)]">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-semibold text-[var(--ink)]">
        {value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
      </dd>
    </div>
  );
}
