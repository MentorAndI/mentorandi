import { getPrismaClient } from "@/lib/prisma";
import type {
  AdminFeedbackEntry,
  CreateFeedbackInput,
  FeedbackRatingInput,
  LegacyFeedbackRating,
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
        feedback."mentorSlug" AS "mentorSlug",
        feedback."pagePath" AS "pagePath",
        feedback.rating::text AS rating,
        feedback."ratingScore" AS "ratingScore",
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
        mentorSlug: input.mentorSlug,
        pagePath: input.pagePath,
        rating: toLegacyRating(input.rating),
        ratingScore: input.rating,
        userId,
      },
      select: { createdAt: true },
    });
  }
}

function toLegacyRating(
  rating: FeedbackRatingInput | undefined,
): LegacyFeedbackRating {
  if (rating !== undefined && rating >= 4) {
    return "USEFUL";
  }

  if (rating !== undefined && rating <= 2) {
    return "NOT_USEFUL";
  }

  return "NEUTRAL";
}
