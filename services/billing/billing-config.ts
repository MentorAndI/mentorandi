import type { PurchasablePlan } from "@/services/billing/billing.types";

export function isStripeEnabled() {
  return process.env.NEXT_PUBLIC_STRIPE_ENABLED?.trim().toLowerCase() === "true";
}

export function isStripeTestModeReady() {
  return (
    isStripeEnabled() &&
    readStripeValue("STRIPE_SECRET_KEY")?.startsWith("sk_test_") === true &&
    readStripeValue("STRIPE_WEBHOOK_SECRET")?.startsWith("whsec_") === true &&
    readStripeValue("STRIPE_PRICE_PERSONAL_MONTHLY")?.startsWith("price_") === true &&
    readStripeValue("STRIPE_PRICE_PREMIUM_MONTHLY")?.startsWith("price_") === true
  );
}

export function assertStripeTestModeReady() {
  if (!isStripeEnabled()) {
    throw new BillingConfigurationError(
      "Payments are not enabled yet. No charge was created.",
    );
  }

  getStripeSecretKey();
  getStripeWebhookSecret();
  getStripePriceId("PERSONAL");
  getStripePriceId("PREMIUM");
}

export function getStripeSecretKey() {
  const key = requireStripeValue("STRIPE_SECRET_KEY");

  if (!key.startsWith("sk_test_")) {
    throw new BillingConfigurationError(
      "Only Stripe test mode is allowed in the alpha environment.",
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
  const priceId = requireStripeValue(
    plan === "PERSONAL"
      ? "STRIPE_PRICE_PERSONAL_MONTHLY"
      : "STRIPE_PRICE_PREMIUM_MONTHLY",
  );

  if (!priceId.startsWith("price_")) {
    throw new BillingConfigurationError(
      "Payments are temporarily unavailable because billing setup is incomplete.",
    );
  }

  return priceId;
}

export function getPlanForStripePrice(priceId: string) {
  if (priceId === readStripeValue("STRIPE_PRICE_PERSONAL_MONTHLY")) {
    return "PERSONAL" as const;
  }

  if (priceId === readStripeValue("STRIPE_PRICE_PREMIUM_MONTHLY")) {
    return "PREMIUM" as const;
  }

  return null;
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

export class BillingConfigurationError extends Error {
  readonly statusCode = 503;

  constructor(message: string) {
    super(message);
    this.name = "BillingConfigurationError";
  }
}
