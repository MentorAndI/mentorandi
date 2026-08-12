import { getPrismaClient } from "@/lib/prisma";

export class MentorAccessRepository {
  private readonly prisma = getPrismaClient();

  findSubscriptionForUser(userId: string) {
    return this.prisma.subscription.findUnique({
      select: { plan: true, status: true },
      where: { userId },
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
