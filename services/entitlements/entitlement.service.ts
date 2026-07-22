import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/generated/prisma/client";
import { EntitlementRepository } from "@/services/entitlements/entitlement.repository";
import type { UsageLimitConfig } from "@/services/usage-limits/usage-limits.types";

const activeStatuses = new Set<SubscriptionStatus>([
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
]);

const limitMultipliers: Record<SubscriptionPlan, { deep: number; messages: number }> = {
  ALPHA: { deep: 1, messages: 1 },
  FREE: { deep: 1, messages: 1 },
  PERSONAL: { deep: 2, messages: 2 },
  PREMIUM: { deep: 4, messages: 4 },
  FOUNDER: { deep: 4, messages: 4 },
};

export class EntitlementService {
  constructor(private readonly repository = new EntitlementRepository()) {}

  async resolveUsageConfig(userId: string, base: UsageLimitConfig) {
    const subscription = await this.repository.findSubscriptionForUser(userId);
    const plan =
      subscription && activeStatuses.has(subscription.status)
        ? subscription.plan
        : SubscriptionPlan.ALPHA;
    const multiplier = limitMultipliers[plan];

    return {
      config: {
        ...base,
        dailyMessageLimit: multiply(base.dailyMessageLimit, multiplier.messages),
        monthlyMessageLimit: multiply(base.monthlyMessageLimit, multiplier.messages),
        weeklyDeepLimit: multiply(base.weeklyDeepLimit, multiplier.deep),
        weeklyMessageLimit: multiply(base.weeklyMessageLimit, multiplier.messages),
      },
      plan,
    };
  }
}

function multiply(limit: number | null, multiplier: number) {
  return limit === null ? null : limit * multiplier;
}
