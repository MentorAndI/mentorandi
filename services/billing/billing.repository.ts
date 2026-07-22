import { getPrismaClient } from "@/lib/prisma";
import type { SubscriptionUpdate } from "@/services/billing/billing.types";

export class BillingRepository {
  private readonly prisma = getPrismaClient();

  findByUserId(userId: string) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }

  findByBillingSubscriptionId(billingSubscriptionId: string) {
    return this.prisma.subscription.findUnique({
      where: { billingSubscriptionId },
    });
  }

  upsert(input: SubscriptionUpdate) {
    const values = {
      billingProvider: "stripe",
      ...(input.billingCustomerId !== undefined
        ? { billingCustomerId: input.billingCustomerId }
        : {}),
      ...(input.billingSubscriptionId !== undefined
        ? { billingSubscriptionId: input.billingSubscriptionId }
        : {}),
      ...(input.cancelAtPeriodEnd !== undefined
        ? { cancelAtPeriodEnd: input.cancelAtPeriodEnd }
        : {}),
      ...(input.currentPeriodEnd !== undefined
        ? { currentPeriodEnd: input.currentPeriodEnd }
        : {}),
      plan: input.plan,
      status: input.status,
    };

    return this.prisma.subscription.upsert({
      create: { ...values, userId: input.userId },
      update: values,
      where: { userId: input.userId },
    });
  }
}
