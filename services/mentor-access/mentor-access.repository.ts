import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";

export class MentorAccessRepository {
  private readonly prisma = getPrismaClient();

  findSubscriptionForUser(userId: string) {
    return this.prisma.subscription.findUnique({
      select: { plan: true, selectedMentorSlug: true, status: true },
      where: { userId },
    });
  }

  claimSingleMentor(userId: string, mentorSlug: string) {
    return this.prisma.subscription.updateMany({
      data: { selectedMentorSlug: mentorSlug },
      where: {
        plan: SubscriptionPlan.SINGLE,
        selectedMentorSlug: null,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
        },
        userId,
      },
    });
  }

  findOwnedConversationMentor(userId: string, conversationId: string) {
    return this.prisma.conversation.findFirst({
      select: {
        mentor: {
          select: { slug: true },
        },
      },
      where: {
        id: conversationId,
        userId,
      },
    });
  }
}
