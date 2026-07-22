import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/generated/prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getStripePriceId,
  isStripeEnabled,
} from "@/services/billing/billing-config";
import { BillingRepository } from "@/services/billing/billing.repository";
import type { PurchasablePlan } from "@/services/billing/billing.types";
import { StripeClient } from "@/services/billing/stripe-client";
import { UserService } from "@/services/user/user.service";

interface StripeEvent {
  type?: string;
  data?: { object?: Record<string, unknown> };
}

export class BillingService {
  constructor(
    private readonly repository = new BillingRepository(),
    private readonly stripe = new StripeClient(),
    private readonly users = new UserService(),
  ) {}

  async createCheckoutSession(plan: PurchasablePlan, origin: string) {
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
      cancel_url: `${origin}/pricing?billing=canceled`,
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
      status: SubscriptionStatus.ACTIVE,
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

    await this.repository.upsert({
      billingCustomerId: readId(object.customer),
      billingSubscriptionId: subscriptionId,
      cancelAtPeriodEnd: object.cancel_at_period_end === true,
      currentPeriodEnd: readUnixDate(object.current_period_end),
      plan: readPlan(readMetadata(object, "plan"), existing?.plan),
      status: deleted
        ? SubscriptionStatus.CANCELED
        : readStatus(readString(object.status)),
      userId,
    });
  }
}

export class BillingServiceError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = "BillingServiceError";
  }
}

export function paymentsAvailable() {
  return isStripeEnabled();
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

function readPlan(value: string | null, fallback?: SubscriptionPlan) {
  return value === "PREMIUM"
    ? SubscriptionPlan.PREMIUM
    : value === "PERSONAL"
      ? SubscriptionPlan.PERSONAL
      : (fallback ?? SubscriptionPlan.ALPHA);
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
