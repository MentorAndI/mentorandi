import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/generated/prisma/client";
import { BillingRepository } from "@/services/billing/billing.repository";
import type { PurchaseStatus } from "@/services/billing/billing.types";
import { UserService } from "@/services/user/user.service";

interface SubscriptionAccessSnapshot {
  billingCustomerId: string | null;
  billingSubscriptionId: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
}

export class BillingAccessService {
  constructor(
    private readonly repository = new BillingRepository(),
    private readonly users = new UserService(),
  ) {}

  async getCurrentPurchaseStatus(): Promise<PurchaseStatus> {
    const user = await this.users.resolveOptionalAuthenticatedUser();

    if (!user) {
      return {
        canPurchaseTopUps: false,
        hasActivePaidSubscription: false,
        isAuthenticated: false,
      };
    }

    return this.getPurchaseStatusForUser(user.id);
  }

  async getPurchaseStatusForUser(userId: string): Promise<PurchaseStatus> {
    const subscription = await this.repository.findByUserId(userId);

    return {
      canPurchaseTopUps: isEligibleForTopUpPurchase(subscription),
      hasActivePaidSubscription:
        isVerifiedActivePaidSubscription(subscription),
      isAuthenticated: true,
    };
  }
}

export function isEligibleForTopUpPurchase(
  subscription: SubscriptionAccessSnapshot | null,
) {
  if (
    !subscription?.billingCustomerId ||
    !subscription.billingSubscriptionId ||
    subscription.status !== SubscriptionStatus.ACTIVE
  ) {
    return false;
  }

  return isConsumerPaidPlan(subscription.plan);
}

export function isVerifiedActivePaidSubscription(
  subscription: SubscriptionAccessSnapshot | null,
) {
  if (!subscription?.billingSubscriptionId) return false;

  const active =
    subscription.status === SubscriptionStatus.ACTIVE ||
    subscription.status === SubscriptionStatus.TRIALING;
  const paidPlan = isConsumerPaidPlan(subscription.plan);

  return active && paidPlan;
}

function isConsumerPaidPlan(plan: SubscriptionPlan) {
  return (
    plan === SubscriptionPlan.SINGLE ||
    plan === SubscriptionPlan.PLUS ||
    plan === SubscriptionPlan.PREMIUM
  );
}
