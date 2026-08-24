import type { Metadata } from "next";

import { AccountDataControls } from "@/components/account/AccountDataControls";
import { BillingPortalButton } from "@/components/billing/BillingPortalButton";
import { AccountNavigation } from "@/components/auth/AccountNavigation";
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
  description: "Manage Mentor And I account data controls.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const billing = (await searchParams).billing;
  const user = await new UserService().resolveCurrentUser();
  const creditBalance = await new CreditService().getBalanceForUser(user.id);

  return (
    <main className="min-h-screen bg-zinc-50 py-10 text-zinc-950">
      <Container className="max-w-5xl">
        <AccountNavigation
          links={[
            { href: "/mentor", label: "Back to Mentor" },
            { href: "/feedback?context=%2Fsettings", label: "Feedback" },
          ]}
        />
        {billing === "success" ? (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            Checkout returned successfully. Subscription access is applied only
            after Mentor And I receives and verifies the Stripe webhook.
          </div>
        ) : null}
        <div className="mb-8 max-w-2xl space-y-3">
          <Heading level={1}>Account data</Heading>
          <Text>
            Export your Mentor And I data or delete your mentor data.
          </Text>
        </div>

        <AccountDataControls />
        <Card className="mt-6 p-6" variant="bordered">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">
                Mentor Credits
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Your plan credits are used first. Purchased top-up credits do
                not expire.
              </p>
            </div>
            <Button href="/credits" size="sm">
              Buy more credits
            </Button>
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <CreditBalanceItem
              label="Total credits"
              value={creditBalance.balance}
            />
            <CreditBalanceItem
              label="Plan credits"
              value={creditBalance.planBalance}
            />
            <CreditBalanceItem
              label="Top-up credits"
              value={creditBalance.topUpBalance}
            />
          </dl>
        </Card>
        <div className="mt-6">
          <BillingPortalButton enabled={paymentsAvailable()} />
        </div>
      </Container>
    </main>
  );
}

function CreditBalanceItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4">
      <dt className="text-sm text-zinc-600">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-zinc-950">
        {value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
      </dd>
    </div>
  );
}
