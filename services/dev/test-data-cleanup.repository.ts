import { getPrismaClient } from "@/lib/prisma";

export class TestDataCleanupRepository {
  private readonly prisma = getPrismaClient();

  async deleteMatchingMessagesForUser(userId: string, searchTerms: string[]) {
    return this.prisma.message.deleteMany({
      where: {
        conversation: {
          userId,
        },
        OR: searchTerms.map((term) => ({
          content: {
            contains: term,
            mode: "insensitive" as const,
          },
        })),
      },
    });
  }

  async deleteMatchingMemoriesForUser(userId: string, searchTerms: string[]) {
    return this.prisma.memory.deleteMany({
      where: {
        userId,
        OR: searchTerms.flatMap((term) => [
          {
            title: {
              contains: term,
              mode: "insensitive" as const,
            },
          },
          {
            content: {
              contains: term,
              mode: "insensitive" as const,
            },
          },
        ]),
      },
    });
  }

  async deleteMatchingGoalsForUser(userId: string, searchTerms: string[]) {
    return this.prisma.goal.deleteMany({
      where: {
        userId,
        OR: searchTerms.flatMap((term) => [
          {
            title: {
              contains: term,
              mode: "insensitive" as const,
            },
          },
          {
            description: {
              contains: term,
              mode: "insensitive" as const,
            },
          },
        ]),
      },
    });
  }

  async deleteMatchingReflectionsForUser(
    userId: string,
    searchTerms: string[],
  ) {
    return this.prisma.reflection.deleteMany({
      where: {
        userId,
        OR: searchTerms.map((term) => ({
          summary: {
            contains: term,
            mode: "insensitive" as const,
          },
        })),
      },
    });
  }
}
