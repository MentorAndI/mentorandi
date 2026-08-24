import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/generated/prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  assertStripeReady,
  getExpectedStripeLivemode,
  getPlanForStripePrice,
  getStripePriceId,
  isStripeReady,
} from "@/services/billing/billing-config";
import { isVerifiedActivePaidSubscription } from "@/services/billing/billing-access.service";
import { BillingRepository } from "@/services/billing/billing.repository";
import type { PurchasablePlan } from "@/services/billing/billing.types";
import { toPublicPlan } from "@/services/billing/purchase-flow";
import { StripeClient } from "@/services/billing/stripe-client";
import { CreditService } from "@/services/credits/credit.service";
import { UserService } from "@/services/user/user.service";

interface StripeEvent {
  data?: { object?: Record<string, unknown> };
  id?: string;
  livemode?: boolean;
  type?: string;
}

export class BillingService {
  constructor(
    private readonly repository = new BillingRepository(),
    private readonly stripe = new StripeClient(),
    private readonly users = new UserService(),
    private readonly credits = new CreditService(),
    private readonly resolveEmail = resolveAuthenticatedEmail,
  ) {}

  async createCheckoutSession(plan: PurchasablePlan, origin: string) {
    assertStripeReady();
    const [user, email] = await Promise.all([
      this.users.resolveAuthenticatedUser(),
      this.resolveEmail(),
    ]);
    const subscription = await this.repository.findByUserId(user.id);

    if (isVerifiedActivePaidSubscription(subscription)) {
      throw new BillingServiceError(
        "Your active subscription is already ready. Continue to mentor selection instead.",
        409,
      );
    }

    const publicPlan = toPublicPlan(plan);
    const values: Record<string, string> = {
      "allow_promotion_codes": "true",
      "client_reference_id": user.id,
      "line_items[0][price]": getStripePriceId(plan),
      "line_items[0][quantity]": "1",
      "metadata[plan]": plan,
      "metadata[user_id]": user.id,
      mode: "subscription",
      "subscription_data[metadata][plan]": plan,
      "subscription_data[metadata][user_id]": user.id,
      success_url: `${origin}/onboarding?plan=${publicPlan}&checkout=returned`,
      cancel_url: `${origin}/onboarding?plan=${publicPlan}`,
    };

    if (subscription?.billingCustomerId) {
      values.customer = subscription.billingCustomerId;
    } else if (email) {
      values.customer_email = email;
    }

    const session = await this.stripe.post("/checkout/sessions", values);

    if (!session.url) {
      throw new BillingServiceError("Stripe did not return a checkout URL.", 502);
    }

    return { url: session.url };
  }

  async createPortalSession(origin: string) {
    assertStripeReady();
    const user = await this.users.resolveAuthenticatedUser();
    const subscription = await this.repository.findByUserId(user.id);

    if (!subscription?.billingCustomerId) {
      throw new BillingServiceError(
        "No billing account is available for this user yet.",
        409,
      );
    }

    const session = await this.stripe.post("/billing_portal/sessions", {
      customer: subscription.billingCustomerId,
      return_url: `${origin}/settings`,
    });

    if (!session.url) {
      throw new BillingServiceError("Stripe did not return a portal URL.", 502);
    }

    return { url: session.url };
  }

  async handleWebhook(rawBody: string, signature: string | null) {
    this.stripe.verifyWebhook(rawBody, signature);
    const event = JSON.parse(rawBody) as StripeEvent;
    const object = event.data?.object;

    if (!object || !event.type) return;

    if (event.livemode !== getExpectedStripeLivemode()) {
      throw new BillingServiceError(
        "Stripe event mode does not match the configured billing environment.",
        400,
      );
    }

    if (event.type === "checkout.session.completed") {
      await this.applyCheckout(object);
      return;
    }

    if (event.type === "invoice.payment_succeeded") {
      await this.applyPaidInvoice(object);
      return;
    }

    if (event.type.startsWith("customer.subscription.")) {
      await this.applySubscription(object, event.type.endsWith(".deleted"));
    }
  }

  private async applyCheckout(object: Record<string, unknown>) {
    const userId = readString(object.client_reference_id) ?? readMetadata(object, "user_id");
    if (!userId) return;

    const subscriptionId = readId(object.subscription);
    const plan = readPlan(readMetadata(object, "plan"));
    const paid = isCheckoutPaid(object);

    await this.repository.upsert({
      billingCustomerId: readId(object.customer),
      billingSubscriptionId: subscriptionId,
      plan,
      status: paid
        ? SubscriptionStatus.ACTIVE
        : SubscriptionStatus.INCOMPLETE,
      userId,
    });

    // The paid-invoice webhook is the primary credit grant trigger. This is a
    // safe fallback for webhook reordering when subscription state (including
    // period end) reached us before Checkout completed.
    if (paid && subscriptionId) {
      const stored = await this.repository.findByBillingSubscriptionId(subscriptionId);
      if (stored?.currentPeriodEnd) {
        await this.credits.applyPlanCredits({
          billingSubscriptionId: subscriptionId,
          periodEnd: stored.currentPeriodEnd,
          plan: stored.plan,
          userId,
        });
      }
    }
  }

  private async applyPaidInvoice(object: Record<string, unknown>) {
    const billingReason = readString(object.billing_reason);
    if (
      billingReason !== "subscription_create" &&
      billingReason !== "subscription_cycle" &&
      billingReason !== "subscription_update"
    ) {
      return;
    }

    const subscriptionDetails = readSubscriptionDetails(object);
    const subscriptionId =
      readId(subscriptionDetails?.subscription) ?? readInvoiceLineSubscriptionId(object);
    if (!subscriptionId) return;

    const existing = await this.repository.findByBillingSubscriptionId(subscriptionId);
    const userId =
      readMetadataFromObject(subscriptionDetails, "user_id") ?? existing?.userId;
    if (!userId) return;

    const metadataPlan = readMetadataFromObject(subscriptionDetails, "plan");
    const plan = readPlan(metadataPlan, existing?.plan);
    const periodEnd = readInvoicePeriodEnd(object);
    if (!periodEnd) return;

    await this.repository.upsert({
      billingCustomerId: readId(object.customer) ?? existing?.billingCustomerId,
      billingSubscriptionId: subscriptionId,
      currentPeriodEnd: periodEnd,
      plan,
      status: SubscriptionStatus.ACTIVE,
      userId,
    });

    await this.credits.applyPlanCredits({
      billingSubscriptionId: subscriptionId,
      periodEnd,
      plan,
      userId,
    });
  }

  private async applySubscription(
    object: Record<string, unknown>,
    deleted: boolean,
  ) {
    const subscriptionId = readString(object.id);
    const existing = subscriptionId
      ? await this.repository.findByBillingSubscriptionId(subscriptionId)
      : null;
    const userId = readMetadata(object, "user_id") ?? existing?.userId;
    if (!userId) return;

    const currentPeriodEnd = readSubscriptionPeriodEnd(object);
    const plan = readSubscriptionPlan(object, existing?.plan);
    const status = deleted
      ? SubscriptionStatus.CANCELED
      : readStatus(readString(object.status));

    await this.repository.upsert({
      billingCustomerId: readId(object.customer),
      billingSubscriptionId: subscriptionId,
      cancelAtPeriodEnd: object.cancel_at_period_end === true,
      currentPeriodEnd,
      plan,
      status,
      userId,
    });

    if (deleted || status === SubscriptionStatus.CANCELED) {
      await this.credits.clearPlanCredits(
        userId,
        `subscription:${subscriptionId ?? userId}:ended`,
      );
    }
  }
}

export class BillingServiceError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = "BillingServiceError";
  }
}

export function paymentsAvailable() {
  return isStripeReady();
}

async function resolveAuthenticatedEmail() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.email?.trim().toLowerCase() ?? null;
}

function readMetadata(object: Record<string, unknown>, key: string) {
  return readMetadataFromObject(readObject(object.metadata), key);
}

function readMetadataFromObject(
  object: Record<string, unknown> | null,
  key: string,
) {
  if (!object) return null;
  const metadata = key in object ? object : readObject(object.metadata);
  return metadata ? readString(metadata[key]) : null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readId(value: unknown) {
  return readString(value) ??
    (value && typeof value === "object"
      ? readString((value as Record<string, unknown>).id)
      : null);
}

function readUnixDate(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value * 1000)
    : null;
}

function readSubscriptionPeriodEnd(object: Record<string, unknown>) {
  const topLevel = readUnixDate(object.current_period_end);
  if (topLevel) return topLevel;

  const items = readObject(object.items);
  const data = items && Array.isArray(items.data) ? items.data : [];
  const periodEnds = data
    .map((item) => readObject(item))
    .map((item) => readUnixDate(item?.current_period_end))
    .filter((date): date is Date => Boolean(date));

  return periodEnds.length > 0
    ? new Date(Math.max(...periodEnds.map((date) => date.getTime())))
    : null;
}

function readSubscriptionDetails(object: Record<string, unknown>) {
  const parent = readObject(object.parent);
  return parent ? readObject(parent.subscription_details) : null;
}

function readInvoiceLineSubscriptionId(object: Record<string, unknown>) {
  const lines = readObject(object.lines);
  const data = lines && Array.isArray(lines.data) ? lines.data : [];

  for (const lineValue of data) {
    const line = readObject(lineValue);
    const parent = line ? readObject(line.parent) : null;
    const details = parent ? readObject(parent.subscription_item_details) : null;
    const subscriptionId = readId(details?.subscription);
    if (subscriptionId) return subscriptionId;
  }

  return null;
}

function readInvoicePeriodEnd(object: Record<string, unknown>) {
  const lines = readObject(object.lines);
  const data = lines && Array.isArray(lines.data) ? lines.data : [];
  const periodEnds = data
    .map((lineValue) => readObject(lineValue))
    .map((line) => (line ? readObject(line.period) : null))
    .map((period) => readUnixDate(period?.end))
    .filter((date): date is Date => Boolean(date));

  return periodEnds.length > 0
    ? new Date(Math.max(...periodEnds.map((date) => date.getTime())))
    : readUnixDate(object.period_end);
}

function readSubscriptionPlan(
  object: Record<string, unknown>,
  fallback?: SubscriptionPlan,
) {
  const items = readObject(object.items);
  const data = items && Array.isArray(items.data) ? items.data : [];

  for (const itemValue of data) {
    const item = readObject(itemValue);
    const price = item ? readObject(item.price) : null;
    const priceId = price ? readString(price.id) : null;
    const plan = priceId ? getPlanForStripePrice(priceId) : null;

    if (plan) return readPlan(plan, fallback);
  }

  return readPlan(readMetadata(object, "plan"), fallback);
}

function readObject(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function isCheckoutPaid(object: Record<string, unknown>) {
  const paymentStatus = readString(object.payment_status);
  return paymentStatus === "paid" || paymentStatus === "no_payment_required";
}

function readPlan(value: string | null, fallback?: SubscriptionPlan) {
  switch (value) {
    case "SINGLE":
      return SubscriptionPlan.SINGLE;
    case "PLUS":
      return SubscriptionPlan.PLUS;
    case "PREMIUM":
      return SubscriptionPlan.PREMIUM;
    case "COMPANY_STRESS":
      return SubscriptionPlan.COMPANY_STRESS;
    case "FREE":
      return SubscriptionPlan.FREE;
    case "FOUNDER":
      return SubscriptionPlan.FOUNDER;
    case "PERSONAL":
      return SubscriptionPlan.PERSONAL;
    case "ALPHA":
      return SubscriptionPlan.ALPHA;
    default:
      return fallback ?? SubscriptionPlan.ALPHA;
  }
}

function readStatus(value: string | null) {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: SubscriptionStatus.ACTIVE,
    canceled: SubscriptionStatus.CANCELED,
    incomplete: SubscriptionStatus.INCOMPLETE,
    incomplete_expired: SubscriptionStatus.INACTIVE,
    past_due: SubscriptionStatus.PAST_DUE,
    paused: SubscriptionStatus.INACTIVE,
    trialing: SubscriptionStatus.TRIALING,
    unpaid: SubscriptionStatus.UNPAID,
  };
  return statusMap[value ?? ""] ?? SubscriptionStatus.INACTIVE;
}
