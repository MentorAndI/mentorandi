import type {
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/generated/prisma/client";
import {
  getActiveMentorProfile,
  getActiveMentorProfileByDatabaseSlug,
} from "@/services/mentor-catalog/mentor-catalog";
import type { ActiveMentorSlug } from "@/services/mentor-catalog/mentor-catalog.types";
import {
  evaluateMentorAccess,
  type MentorPlan,
} from "@/services/mentor-access/mentor-access-policy";
import { MentorAccessRepository } from "@/services/mentor-access/mentor-access.repository";

export const mentorLockedMessage =
  "This mentor is not included in your current plan.";
export const mentorUpgradeMessage = "Upgrade to unlock this mentor";

interface StoredSubscription {
  plan: SubscriptionPlan;
  selectedMentorSlug: string | null;
  status: SubscriptionStatus;
}

interface MentorAccessRepositoryContract {
  claimSingleMentor(userId: string, mentorSlug: string): Promise<unknown>;
  findOwnedConversationMentor(userId: string, conversationId: string): Promise<{
    mentor: { slug: string };
  } | null>;
  findSubscriptionForUser(userId: string): Promise<StoredSubscription | null>;
}

export interface ResolvedMentorEntitlement {
  plan: MentorPlan;
  selectedMentorSlug: ActiveMentorSlug | null;
  source:
    | "active_subscription"
    | "development_default"
    | "safe_default";
}

export class MentorAccessServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly upgradeMessage?: string,
  ) {
    super(message);
    this.name = "MentorAccessServiceError";
  }
}

export class MentorAccessService {
  constructor(
    private readonly repository: MentorAccessRepositoryContract =
      new MentorAccessRepository(),
  ) {}

  async assertMentorAccess(userId: string, mentorSlug: ActiveMentorSlug) {
    let entitlement = await this.resolveEntitlement(userId);

    if (
      entitlement.plan === "single_mentor" &&
      !entitlement.selectedMentorSlug &&
      mentorSlug !== "life"
    ) {
      await this.repository.claimSingleMentor(userId, mentorSlug);
      entitlement = await this.resolveEntitlement(userId);
    }

    const decision = evaluateMentorAccess({
      mentorSlug,
      plan: entitlement.plan,
      selectedMentorSlug: entitlement.selectedMentorSlug,
    });

    if (!decision.allowed) {
      throw new MentorAccessServiceError(
        mentorLockedMessage,
        403,
        mentorUpgradeMessage,
      );
    }

    return { entitlement, policy: decision.policy };
  }

  async assertConversationMentorAccess(
    userId: string,
    conversationId: string,
  ) {
    const conversation =
      await this.repository.findOwnedConversationMentor(userId, conversationId);
    const mentorSlug = conversation
      ? getActiveMentorProfileByDatabaseSlug(conversation.mentor.slug)?.slug
      : null;

    if (!mentorSlug) {
      throw new MentorAccessServiceError("Conversation was not found.", 404);
    }

    return this.assertMentorAccess(userId, mentorSlug);
  }

  async resolveEntitlement(userId: string): Promise<ResolvedMentorEntitlement> {
    const subscription = await this.repository.findSubscriptionForUser(userId);

    if (!subscription || !isActiveSubscription(subscription.status)) {
      return {
        plan: isProductionEnvironment() ? "free" : "plus",
        selectedMentorSlug: null,
        source: isProductionEnvironment()
          ? "safe_default"
          : "development_default",
      };
    }

    return {
      plan: mapStoredPlan(subscription.plan),
      selectedMentorSlug: normalizeSelectedMentorSlug(
        subscription.selectedMentorSlug,
      ),
      source: "active_subscription",
    };
  }
}

function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

function isActiveSubscription(status: SubscriptionStatus) {
  return status === "ACTIVE" || status === "TRIALING";
}

function normalizeSelectedMentorSlug(value: string | null) {
  return getActiveMentorProfile(value)?.slug ?? null;
}

export function mapStoredPlan(plan: SubscriptionPlan): MentorPlan {
  switch (plan) {
    case "FREE":
      return "free";
    case "SINGLE":
      return "single_mentor";
    case "PLUS":
      return "plus";
    case "COMPANY_STRESS":
      return "company_stress";
    case "PREMIUM":
    case "FOUNDER":
      return "premium";
    case "ALPHA":
    case "PERSONAL":
      return "plus";
  }
}
