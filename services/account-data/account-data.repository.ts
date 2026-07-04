import { getPrismaClient } from "@/lib/prisma";

export class AccountDataRepository {
  private readonly prisma = getPrismaClient();

  async exportDataForUser(userId: string) {
    const [
      user,
      conversations,
      messages,
      memories,
      goals,
      reflections,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
      }),
      this.prisma.conversation.findMany({
        include: {
          mentor: {
            select: {
              active: true,
              description: true,
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        where: { userId },
      }),
      this.prisma.message.findMany({
        orderBy: {
          createdAt: "asc",
        },
        where: {
          conversation: {
            userId,
          },
        },
      }),
      this.prisma.memory.findMany({
        orderBy: {
          createdAt: "asc",
        },
        where: { userId },
      }),
      this.prisma.goal.findMany({
        orderBy: {
          createdAt: "asc",
        },
        where: { userId },
      }),
      this.prisma.reflection.findMany({
        orderBy: {
          createdAt: "asc",
        },
        where: { userId },
      }),
    ]);

    return {
      conversations,
      goals,
      memories,
      messages,
      reflections,
      user,
    };
  }

  async deleteMentorDataForUser(userId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const deletedMessages = await transaction.message.deleteMany({
        where: {
          conversation: {
            userId,
          },
        },
      });
      const deletedConversations = await transaction.conversation.deleteMany({
        where: { userId },
      });
      const deletedMemories = await transaction.memory.deleteMany({
        where: { userId },
      });
      const deletedGoals = await transaction.goal.deleteMany({
        where: { userId },
      });
      const deletedReflections = await transaction.reflection.deleteMany({
        where: { userId },
      });

      return {
        deletedConversations: deletedConversations.count,
        deletedGoals: deletedGoals.count,
        deletedMemories: deletedMemories.count,
        deletedMessages: deletedMessages.count,
        deletedReflections: deletedReflections.count,
      };
    });
  }
}
