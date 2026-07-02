import { GoalStatus } from "@/lib/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";

export class ContextBuilderRepository {
  private readonly prisma = getPrismaClient();

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async findConversationForUser(conversationId: string, userId: string) {
    return this.prisma.conversation.findFirst({
      include: {
        mentor: true,
      },
      where: {
        id: conversationId,
        userId,
      },
    });
  }

  async findRecentMessages(conversationId: string, limit: number) {
    const messages = await this.prisma.message.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      where: { conversationId },
    });

    return messages.reverse();
  }

  async findActiveGoals(userId: string, limit: number) {
    return this.prisma.goal.findMany({
      orderBy: [
        { targetDate: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      take: limit,
      where: {
        status: GoalStatus.ACTIVE,
        userId,
      },
    });
  }

  async findRecentReflections(userId: string, limit: number) {
    return this.prisma.reflection.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      where: { userId },
    });
  }
}
