import type {
  PublicPurchasablePlan,
  PurchasablePlan,
} from "@/services/billing/billing.types";

export type PublicPlan = "free" | PublicPurchasablePlan;

export interface PaidPlanDetails {
  checkoutPlan: PurchasablePlan;
  monthlyCredits: number;
  monthlyPrice: number;
  name: string;
  publicPlan: PublicPurchasablePlan;
  summary: string;
}

const paidPlanDetails: Record<PublicPurchasablePlan, PaidPlanDetails> = {
  plus: {
    checkoutPlan: "PLUS",
    monthlyCredits: 2_000,
    monthlyPrice: 39,
    name: "Mentor Plus",
    publicPlan: "plus",
    summary:
      "Use all main mentors for broader support across different parts of life.",
  },
  premium: {
    checkoutPlan: "PREMIUM",
    monthlyCredits: 5_000,
    monthlyPrice: 69,
    name: "Premium",
    publicPlan: "premium",
    summary:
      "Get more frequent mentoring, deeper sessions, and advanced long-term guidance.",
  },
  single: {
    checkoutPlan: "SINGLE",
    monthlyCredits: 800,
    monthlyPrice: 19,
    name: "Single Mentor",
    publicPlan: "single",
    summary:
      "Choose one specialist mentor for focused, ongoing guidance.",
  },
};

export function normalizeRequestedPlan(value?: string): PublicPlan {
  if (value === "single" || value === "plus" || value === "premium") {
    return value;
  }

  return "free";
}

export function buildOnboardingPath(plan?: string) {
  return `/onboarding?plan=${normalizeRequestedPlan(plan)}`;
}

export function getPaidPlanDetails(
  plan: PublicPlan,
): PaidPlanDetails | null {
  return plan === "free" ? null : paidPlanDetails[plan];
}

export function toPublicPlan(plan: PurchasablePlan): PublicPurchasablePlan {
  switch (plan) {
    case "SINGLE":
      return "single";
    case "PLUS":
      return "plus";
    case "PREMIUM":
      return "premium";
  }
}
