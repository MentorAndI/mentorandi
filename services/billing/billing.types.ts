import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/generated/prisma/client";

export type PurchasablePlan = Extract<SubscriptionPlan, "PERSONAL" | "PREMIUM">;

export interface SubscriptionUpdate {
  billingCustomerId?: string | null;
  billingSubscriptionId?: string | null;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: Date | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  userId: string;
}
