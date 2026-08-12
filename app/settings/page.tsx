import type { Metadata } from "next";

import { AccountDataControls } from "@/components/account/AccountDataControls";
import { BillingPortalButton } from "@/components/billing/BillingPortalButton";
import { AccountNavigation } from "@/components/auth/AccountNavigation";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { paymentsAvailable } from "@/services/billing/billing.service";

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
            Stripe test checkout returned successfully. Subscription status is
            applied by the verified webhook and may take a moment to appear.
          </div>
        ) : null}
        <div className="mb-8 max-w-2xl space-y-3">
          <Heading level={1}>Account data</Heading>
          <Text>
            Export your Mentor And I data or delete your mentor data.
          </Text>
        </div>

        <AccountDataControls />
        <div className="mt-6">
          <BillingPortalButton enabled={paymentsAvailable()} />
        </div>
      </Container>
    </main>
  );
}
