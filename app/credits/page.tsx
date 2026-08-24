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
  title: "Credits | Mentor And I",
  description: "View and purchase Mentor And I service usage credits.",
};

const appLinks = [
  { href: "/mentor", label: "Mentor" },
  { href: "/mentors", label: "Mentors" },
  { href: "/credits", label: "Credits" },
  { href: "/settings", label: "Settings" },
];

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
    <main className="min-h-screen bg-[var(--app-bg)] py-4 text-[var(--ink)] sm:py-6">
      <Container className="max-w-6xl">
        <AccountNavigation links={appLinks} />

        <div className="mb-8 max-w-2xl">
          <p className="font-meta text-[0.7rem] text-[var(--terra-text)]">
            ACCOUNT BALANCE
          </p>
          <Heading className="mt-2" level={1}>
            Credits
          </Heading>
          <Text className="mt-3 leading-7">
            Plan credits are used first. Purchased top-up credits stay in your
            account until you use them.
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
