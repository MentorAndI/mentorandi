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

  async findRelevantMemories(userId: string, conversationId: string, limit: number) {
    const conversationMemories = await this.prisma.memory.findMany({
      orderBy: [{ importance: "desc" }, { confidence: "desc" }, { updatedAt: "desc" }],
      take: limit,
      where: {
        sourceConversationId: conversationId,
        userId,
      },
    });

    if (conversationMemories.length >= limit) {
      return conversationMemories;
    }

    const remainingMemories = await this.prisma.memory.findMany({
      orderBy: [{ importance: "desc" }, { confidence: "desc" }, { updatedAt: "desc" }],
      take: limit - conversationMemories.length,
      where: {
        sourceConversationId: {
          not: conversationId,
        },
        userId,
      },
    });

    return [...conversationMemories, ...remainingMemories];
  }

  async findActiveGoals(userId: string, limit: number) {
    return this.prisma.goal.findMany({
      orderBy: [{ targetDate: "asc" }, { updatedAt: "desc" }],
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
