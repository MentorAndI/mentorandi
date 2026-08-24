import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/generated/prisma/client";

export type PurchasablePlan = Extract<
  SubscriptionPlan,
  "SINGLE" | "PLUS" | "PREMIUM"
>;

export type PublicPurchasablePlan = "single" | "plus" | "premium";

export interface SubscriptionUpdate {
  billingCustomerId?: string | null;
  billingSubscriptionId?: string | null;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: Date | null;
  plan: SubscriptionPlan;
  selectedMentorSlug?: string | null;
  status: SubscriptionStatus;
  userId: string;
}

export interface PurchaseStatus {
  hasActivePaidSubscription: boolean;
  isAuthenticated: boolean;
}
