import type { Metadata } from "next";

import { AccountNavigation } from "@/components/auth/AccountNavigation";
import { CreditsPageClient } from "@/components/billing/CreditsPageClient";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { BillingAccessService } from "@/services/billing/billing-access.service";
import { isTopUpReady } from "@/services/billing/billing-config";
import { getTopUpPackDisplayCatalog } from "@/services/billing/topup-catalog";
import { CreditService } from "@/services/credits/credit.service";
import { UserService } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mentor Credits | Mentor And I",
  description: "View and purchase Mentor And I service usage credits.",
};

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ topup?: string | string[] }>;
}) {
  const user = await new UserService().resolveAuthenticatedUser();
  const [balance, purchaseStatus] = await Promise.all([
    new CreditService().getBalanceForUser(user.id),
    new BillingAccessService().getPurchaseStatusForUser(user.id),
  ]);
  const topupValue = (await searchParams).topup;
  const topup = Array.isArray(topupValue) ? topupValue[0] : topupValue;
  const returnState =
    topup === "returned" || topup === "canceled" ? topup : undefined;

  return (
    <main className="min-h-screen bg-zinc-50 py-10 text-zinc-950">
      <Container className="max-w-5xl">
        <AccountNavigation
          links={[
            { href: "/mentor", label: "Back to Mentor" },
            { href: "/settings", label: "Settings" },
          ]}
        />
        <div className="mb-8 max-w-2xl space-y-3">
          <Heading level={1}>Mentor Credits</Heading>
          <Text>
            See how your plan and purchased top-up credits contribute to your
            current balance.
          </Text>
        </div>

        <CreditsPageClient
          canPurchaseTopUps={purchaseStatus.canPurchaseTopUps}
          initialBalance={balance}
          packs={getTopUpPackDisplayCatalog()}
          returnState={returnState}
          topUpsReady={isTopUpReady()}
        />
      </Container>
    </main>
  );
}
