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
import { BillingRepository } from "@/services/billing/billing.repository";
import type { PurchasablePlan } from "@/services/billing/billing.types";
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
  ) {}

  async createCheckoutSession(plan: PurchasablePlan, origin: string) {
    assertStripeReady();
    const [user, email] = await Promise.all([
      this.users.resolveAuthenticatedUser(),
      resolveAuthenticatedEmail(),
    ]);
    const subscription = await this.repository.findByUserId(user.id);
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
      success_url: `${origin}/settings?billing=success`,
      cancel_url: `${origin}/onboarding?plan=${toPublicPlan(plan)}`,
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

    if (event.type.startsWith("customer.subscription.")) {
      await this.applySubscription(object, event.type.endsWith(".deleted"));
    }
  }

  private async applyCheckout(object: Record<string, unknown>) {
    const userId = readString(object.client_reference_id) ?? readMetadata(object, "user_id");
    if (!userId) return;

    await this.repository.upsert({
      billingCustomerId: readId(object.customer),
      billingSubscriptionId: readId(object.subscription),
      plan: readPlan(readMetadata(object, "plan")),
      status: isCheckoutPaid(object)
        ? SubscriptionStatus.ACTIVE
        : SubscriptionStatus.INCOMPLETE,
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
      return;
    }

    if (
      currentPeriodEnd &&
      (status === SubscriptionStatus.ACTIVE ||
        status === SubscriptionStatus.TRIALING)
    ) {
      await this.credits.applyPlanCredits({
        billingSubscriptionId: subscriptionId,
        periodEnd: currentPeriodEnd,
        plan,
        userId,
      });
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
  const metadata = object.metadata;
  return metadata && typeof metadata === "object"
    ? readString((metadata as Record<string, unknown>)[key])
    : null;
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

function toPublicPlan(plan: PurchasablePlan) {
  switch (plan) {
    case "SINGLE":
      return "single";
    case "PLUS":
      return "plus";
    case "PREMIUM":
      return "premium";
  }
}
