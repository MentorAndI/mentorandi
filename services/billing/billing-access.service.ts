import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/generated/prisma/client";
import { BillingRepository } from "@/services/billing/billing.repository";
import type { PurchaseStatus } from "@/services/billing/billing.types";
import { UserService } from "@/services/user/user.service";

interface SubscriptionAccessSnapshot {
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
        hasActivePaidSubscription: false,
        isAuthenticated: false,
      };
    }

    const subscription = await this.repository.findByUserId(user.id);

    return {
      hasActivePaidSubscription:
        isVerifiedActivePaidSubscription(subscription),
      isAuthenticated: true,
    };
  }
}

export function isVerifiedActivePaidSubscription(
  subscription: SubscriptionAccessSnapshot | null,
) {
  if (!subscription?.billingSubscriptionId) return false;

  const active =
    subscription.status === SubscriptionStatus.ACTIVE ||
    subscription.status === SubscriptionStatus.TRIALING;
  const paidPlan =
    subscription.plan === SubscriptionPlan.SINGLE ||
    subscription.plan === SubscriptionPlan.PLUS ||
    subscription.plan === SubscriptionPlan.PREMIUM;

  return active && paidPlan;
}
