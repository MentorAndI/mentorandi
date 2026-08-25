import { getPrismaClient } from "@/lib/prisma";

export class AccountDataRepository {
  private readonly prisma = getPrismaClient();

  async exportDataForUser(userId: string) {
    const [
      user,
      conversations,
      messages,
      memories,
      mentorNotes,
      goals,
      reflections,
      journalEntries,
      feedback,
      usageEvents,
      subscription,
      creditAccount,
      creditTransactions,
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
      this.prisma.mentorNote.findMany({
        include: { mentor: { select: { name: true, slug: true } } },
        orderBy: { createdAt: "asc" },
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
      this.prisma.journalEntry.findMany({
        orderBy: {
          createdAt: "asc",
        },
        where: { userId },
      }),
      this.prisma.feedback.findMany({
        orderBy: {
          createdAt: "asc",
        },
        where: { userId },
      }),
      this.prisma.usageEvent.findMany({
        orderBy: {
          createdAt: "asc",
        },
        where: { userId },
      }),
      this.prisma.subscription.findUnique({
        where: { userId },
      }),
      this.prisma.creditAccount.findUnique({
        where: { userId },
      }),
      this.prisma.creditTransaction.findMany({
        orderBy: {
          createdAt: "asc",
        },
        where: { userId },
      }),
    ]);

    return {
      conversations,
      creditAccount,
      creditTransactions,
      feedback,
      goals,
      journalEntries,
      memories,
      mentorNotes,
      messages,
      reflections,
      subscription,
      usageEvents,
      user,
    };
  }

  async deleteMentorDataForUser(userId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const deletedFeedback = await transaction.feedback.deleteMany({
        where: { userId },
      });
      const deletedJournalEntries = await transaction.journalEntry.deleteMany({
        where: { userId },
      });
      const deletedUsageEvents = await transaction.usageEvent.deleteMany({
        where: { userId },
      });
      const deletedMentorNotes = await transaction.mentorNote.deleteMany({
        where: { userId },
      });
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
      const clearedSubscription = await transaction.subscription.updateMany({
        data: { selectedMentorSlug: null },
        where: {
          selectedMentorSlug: { not: null },
          userId,
        },
      });

      return {
        clearedSelectedMentor: clearedSubscription.count > 0,
        deletedConversations: deletedConversations.count,
        deletedFeedback: deletedFeedback.count,
        deletedGoals: deletedGoals.count,
        deletedJournalEntries: deletedJournalEntries.count,
        deletedMemories: deletedMemories.count,
        deletedMentorNotes: deletedMentorNotes.count,
        deletedMessages: deletedMessages.count,
        deletedReflections: deletedReflections.count,
        deletedUsageEvents: deletedUsageEvents.count,
      };
    });
  }
}