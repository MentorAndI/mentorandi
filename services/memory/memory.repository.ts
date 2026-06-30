import { getPrismaClient } from "@/lib/prisma";
import type {
  CreateMemoryInput,
  MemoryFilters,
  UpdateMemoryInput,
} from "@/services/memory/memory.types";

export class MemoryRepository {
  private readonly prisma = getPrismaClient();

  async findUserByAuthUserId(authUserId: string) {
    return this.prisma.user.findUnique({
      where: { authUserId },
    });
  }

  async createUserForAuthUser(authUserId: string) {
    return this.prisma.user.create({
      data: { authUserId },
    });
  }

  async findSourceConversationForUser(
    sourceConversationId: string,
    userId: string,
  ) {
    return this.prisma.conversation.findFirst({
      where: {
        id: sourceConversationId,
        userId,
      },
    });
  }

  async findMemoriesForUser(userId: string, filters: MemoryFilters) {
    return this.prisma.memory.findMany({
      orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
      where: {
        userId,
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.minimumImportance !== undefined
          ? { importance: { gte: filters.minimumImportance } }
          : {}),
        ...(filters.minimumConfidence !== undefined
          ? { confidence: { gte: filters.minimumConfidence } }
          : {}),
      },
    });
  }

  async findMemoryForUser(memoryId: string, userId: string) {
    return this.prisma.memory.findFirst({
      where: {
        id: memoryId,
        userId,
      },
    });
  }

  async createMemoryForUser(userId: string, input: CreateMemoryInput) {
    return this.prisma.memory.create({
      data: {
        category: input.category,
        confidence: input.confidence,
        content: input.content,
        importance: input.importance,
        sourceConversationId: input.sourceConversationId,
        title: input.title,
        userId,
      },
    });
  }

  async updateMemoryForUser(
    memoryId: string,
    userId: string,
    input: UpdateMemoryInput,
  ) {
    return this.prisma.memory.updateManyAndReturn({
      data: input,
      where: {
        id: memoryId,
        userId,
      },
    });
  }

  async deleteMemoryForUser(memoryId: string, userId: string) {
    return this.prisma.memory.deleteMany({
      where: {
        id: memoryId,
        userId,
      },
    });
  }
}
