import type { PurchasablePlan } from "@/services/billing/billing.types";
import { BillingConfigurationError } from "@/services/billing/billing-configuration-error";
import { assertTopUpPricesReady } from "@/services/billing/topup-catalog";

export { BillingConfigurationError } from "@/services/billing/billing-configuration-error";

type StripeMode = "live" | "test";

const priceEnvironmentVariables: Record<PurchasablePlan, string> = {
  PLUS: "STRIPE_PRICE_PLUS_MONTHLY",
  PREMIUM: "STRIPE_PRICE_PREMIUM_MONTHLY",
  SINGLE: "STRIPE_PRICE_SINGLE_MONTHLY",
};

export function isStripeEnabled() {
  return process.env.NEXT_PUBLIC_STRIPE_ENABLED?.trim().toLowerCase() === "true";
}

export function getStripeMode(): StripeMode {
  const configured = process.env.STRIPE_MODE?.trim().toLowerCase();

  if (!configured) return "test";
  if (configured === "test" || configured === "live") return configured;

  throw new BillingConfigurationError(
    "Payments are temporarily unavailable because the Stripe environment is invalid.",
  );
}

export function getExpectedStripeLivemode() {
  return getStripeMode() === "live";
}

export function isStripeReady() {
  if (!isStripeEnabled()) return false;

  try {
    getStripeMode();
    getStripeSecretKey();
    getStripeWebhookSecret();
    getStripePriceId("SINGLE");
    getStripePriceId("PLUS");
    getStripePriceId("PREMIUM");
    return true;
  } catch {
    return false;
  }
}

export function assertStripeReady() {
  if (!isStripeEnabled()) {
    throw new BillingConfigurationError(
      "Payments are not enabled yet. No charge was created.",
    );
  }

  getStripeMode();
  getStripeSecretKey();
  getStripeWebhookSecret();
  getStripePriceId("SINGLE");
  getStripePriceId("PLUS");
  getStripePriceId("PREMIUM");
}

export function isTopUpReady() {
  if (!isStripeReady()) return false;

  try {
    assertTopUpPricesReady();
    return true;
  } catch {
    return false;
  }
}

export function assertTopUpReady() {
  assertStripeReady();
  assertTopUpPricesReady();
}

// Backwards-compatible staging helpers. They intentionally fail closed in live mode.
export function isStripeTestModeReady() {
  try {
    return getStripeMode() === "test" && isStripeReady();
  } catch {
    return false;
  }
}

export function assertStripeTestModeReady() {
  if (getStripeMode() !== "test") {
    throw new BillingConfigurationError(
      "Stripe test mode is required for this operation.",
    );
  }

  assertStripeReady();
}

export function getStripeSecretKey() {
  const key = requireStripeValue("STRIPE_SECRET_KEY");
  const allowedPrefixes =
    getStripeMode() === "live"
      ? ["sk_live_", "rk_live_"]
      : ["sk_test_", "rk_test_"];

  if (!allowedPrefixes.some((prefix) => key.startsWith(prefix))) {
    throw new BillingConfigurationError(
      `Stripe credentials do not match STRIPE_MODE=${getStripeMode()}.`,
    );
  }

  return key;
}

export function getStripeWebhookSecret() {
  const secret = requireStripeValue("STRIPE_WEBHOOK_SECRET");

  if (!secret.startsWith("whsec_")) {
    throw new BillingConfigurationError(
      "Payments are temporarily unavailable because billing setup is incomplete.",
    );
  }

  return secret;
}

export function getStripePriceId(plan: PurchasablePlan) {
  const priceId = readConfiguredPrice(plan);

  if (!priceId) {
    throw new BillingConfigurationError(
      "Payments are temporarily unavailable because billing setup is incomplete.",
    );
  }

  if (!priceId.startsWith("price_")) {
    throw new BillingConfigurationError(
      "Payments are temporarily unavailable because billing setup is incomplete.",
    );
  }

  return priceId;
}

export function getPlanForStripePrice(priceId: string): PurchasablePlan | null {
  for (const plan of ["SINGLE", "PLUS", "PREMIUM"] as const) {
    if (priceId === readConfiguredPrice(plan)) {
      return plan;
    }
  }

  return null;
}

function readConfiguredPrice(plan: PurchasablePlan) {
  const current = readStripeValue(priceEnvironmentVariables[plan]);
  if (current) return current;

  // Preserve the existing staging configuration during the production rollout.
  // Live mode never falls back to legacy price variables.
  if (getStripeMode() !== "test") return null;

  if (plan === "SINGLE" || plan === "PLUS") {
    return readStripeValue("STRIPE_PRICE_PERSONAL_MONTHLY");
  }

  return readStripeValue("STRIPE_PRICE_PREMIUM_MONTHLY");
}

function requireStripeValue(name: string) {
  if (!isStripeEnabled()) {
    throw new BillingConfigurationError(
      "Payments are not enabled yet. No charge was created.",
    );
  }

  const value = readStripeValue(name);

  if (!value) {
    throw new BillingConfigurationError(
      "Payments are temporarily unavailable because billing setup is incomplete.",
    );
  }

  return value;
}

function readStripeValue(name: string) {
  return process.env[name]?.trim() || null;
}
