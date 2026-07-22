import type { PurchasablePlan } from "@/services/billing/billing.types";

export function isStripeEnabled() {
  return process.env.NEXT_PUBLIC_STRIPE_ENABLED?.trim().toLowerCase() === "true";
}

export function getStripeSecretKey() {
  return requireStripeValue("STRIPE_SECRET_KEY");
}

export function getStripeWebhookSecret() {
  return requireStripeValue("STRIPE_WEBHOOK_SECRET");
}

export function getStripePriceId(plan: PurchasablePlan) {
  return requireStripeValue(
    plan === "PERSONAL"
      ? "STRIPE_PRICE_PERSONAL_MONTHLY"
      : "STRIPE_PRICE_PREMIUM_MONTHLY",
  );
}

function requireStripeValue(name: string) {
  if (!isStripeEnabled()) {
    throw new BillingConfigurationError(
      "Payments are not enabled yet. No charge was created.",
    );
  }

  const value = process.env[name]?.trim();

  if (!value) {
    throw new BillingConfigurationError(
      "Payments are temporarily unavailable because billing setup is incomplete.",
    );
  }

  return value;
}

export class BillingConfigurationError extends Error {
  readonly statusCode = 503;

  constructor(message: string) {
    super(message);
    this.name = "BillingConfigurationError";
  }
}
