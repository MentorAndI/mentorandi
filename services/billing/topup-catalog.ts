import { BillingConfigurationError } from "@/services/billing/billing-configuration-error";
import type {
  TopUpPackDisplay,
  TopUpPackKey,
} from "@/services/billing/topup.types";
import { topUpPackKeys } from "@/services/billing/topup.types";

interface TopUpPackDefinition extends TopUpPackDisplay {
  priceEnvironmentVariable: string;
}

const topUpPackDefinitions: Record<TopUpPackKey, TopUpPackDefinition> = {
  topup_1000: {
    credits: 1_000,
    displayPrice: 10,
    key: "topup_1000",
    priceEnvironmentVariable: "STRIPE_PRICE_TOPUP_1000",
  },
  topup_2500: {
    credits: 2_500,
    displayPrice: 25,
    key: "topup_2500",
    priceEnvironmentVariable: "STRIPE_PRICE_TOPUP_2500",
  },
  topup_5000: {
    credits: 5_000,
    displayPrice: 50,
    key: "topup_5000",
    priceEnvironmentVariable: "STRIPE_PRICE_TOPUP_5000",
  },
};

export function getTopUpPackDisplayCatalog(): TopUpPackDisplay[] {
  return topUpPackKeys.map((key) => {
    const { credits, displayPrice } = topUpPackDefinitions[key];

    return { credits, displayPrice, key };
  });
}

export function getTopUpPack(key: TopUpPackKey) {
  const definition = topUpPackDefinitions[key];
  const priceId = process.env[definition.priceEnvironmentVariable]?.trim();

  if (!priceId?.startsWith("price_")) {
    throw new BillingConfigurationError(
      "Mentor Credit top-ups are temporarily unavailable because billing setup is incomplete.",
    );
  }

  return {
    credits: definition.credits,
    displayPrice: definition.displayPrice,
    key: definition.key,
    priceId,
  };
}

export function assertTopUpPricesReady() {
  for (const key of topUpPackKeys) getTopUpPack(key);
}
