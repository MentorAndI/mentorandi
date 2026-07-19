import { getPrismaClient } from "@/lib/prisma";
import type {
  AdminFeedbackEntry,
  CreateFeedbackInput,
} from "@/services/feedback/feedback.types";

interface AdminFeedbackRow extends Omit<AdminFeedbackEntry, "createdAt"> {
  createdAt: Date;
}

export class FeedbackRepository {
  private readonly prisma = getPrismaClient();

  async findRecentFeedback(limit: number) {
    return this.prisma.$queryRaw<AdminFeedbackRow[]>`
      SELECT
        feedback.category::text AS category,
        feedback."createdAt" AS "createdAt",
        feedback.message,
        feedback."pagePath" AS "pagePath",
        feedback.rating::text AS rating,
        COALESCE(auth_user.email, 'Email unavailable') AS "userEmail"
      FROM public."Feedback" AS feedback
      INNER JOIN public."User" AS app_user ON app_user.id = feedback."userId"
      LEFT JOIN auth.users AS auth_user ON auth_user.id = app_user."authUserId"
      ORDER BY feedback."createdAt" DESC
      LIMIT ${limit}
    `;
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
