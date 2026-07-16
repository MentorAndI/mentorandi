import { getPrismaClient } from "@/lib/prisma";
import type { CreateFeedbackInput } from "@/services/feedback/feedback.types";

export class FeedbackRepository {
  private readonly prisma = getPrismaClient();

  async findRecentFeedback(limit: number) {
    return this.prisma.feedback.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        category: true,
        createdAt: true,
        message: true,
        pagePath: true,
        rating: true,
        userId: true,
      },
      take: limit,
    });
  }

  async createFeedbackForUser(userId: string, input: CreateFeedbackInput) {
    return this.prisma.feedback.create({
      data: {
        category: input.category,
        message: input.message,
        pagePath: input.pagePath,
        rating: input.rating,
        userId,
      },
      select: { createdAt: true },
    });
  }
}
