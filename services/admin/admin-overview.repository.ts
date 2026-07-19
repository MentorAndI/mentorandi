import { getPrismaClient } from "@/lib/prisma";

interface RecentUserRow {
  conversationCount: number;
  createdAt: Date;
  email: string | null;
  feedbackCount: number;
  lastActivityAt: Date;
  messageCount: number;
}

interface RecentConversationRow {
  createdAt: Date;
  email: string | null;
  mentorName: string;
  messageCount: number;
  updatedAt: Date;
}

export class AdminOverviewRepository {
  private readonly prisma = getPrismaClient();

  async getOverviewData(recentLimit: number) {
    const [
      userCount,
      conversationCount,
      messageCount,
      feedbackCount,
      recentUsers,
      recentConversations,
      feedbackByCategory,
      feedbackByRating,
      recentFeedback,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.conversation.count(),
      this.prisma.message.count(),
      this.prisma.feedback.count(),
      this.prisma.$queryRaw<RecentUserRow[]>`
        SELECT
          COALESCE(auth_user.email, 'Email unavailable') AS email,
          app_user."createdAt" AS "createdAt",
          GREATEST(
            app_user."updatedAt",
            COALESCE(MAX(conversation."updatedAt"), app_user."updatedAt"),
            COALESCE(MAX(feedback."createdAt"), app_user."updatedAt")
          ) AS "lastActivityAt",
          COUNT(DISTINCT conversation.id)::int AS "conversationCount",
          COUNT(DISTINCT message.id)::int AS "messageCount",
          COUNT(DISTINCT feedback.id)::int AS "feedbackCount"
        FROM public."User" AS app_user
        LEFT JOIN auth.users AS auth_user ON auth_user.id = app_user."authUserId"
        LEFT JOIN public."Conversation" AS conversation ON conversation."userId" = app_user.id
        LEFT JOIN public."Message" AS message ON message."conversationId" = conversation.id
        LEFT JOIN public."Feedback" AS feedback ON feedback."userId" = app_user.id
        GROUP BY app_user.id, auth_user.email
        ORDER BY app_user."createdAt" DESC
        LIMIT ${recentLimit}
      `,
      this.prisma.$queryRaw<RecentConversationRow[]>`
        SELECT
          COALESCE(auth_user.email, 'Email unavailable') AS email,
          mentor.name AS "mentorName",
          conversation."createdAt" AS "createdAt",
          conversation."updatedAt" AS "updatedAt",
          COUNT(message.id)::int AS "messageCount"
        FROM public."Conversation" AS conversation
        INNER JOIN public."User" AS app_user ON app_user.id = conversation."userId"
        LEFT JOIN auth.users AS auth_user ON auth_user.id = app_user."authUserId"
        INNER JOIN public."Mentor" AS mentor ON mentor.id = conversation."mentorId"
        LEFT JOIN public."Message" AS message ON message."conversationId" = conversation.id
        GROUP BY conversation.id, auth_user.email, mentor.name
        ORDER BY conversation."updatedAt" DESC
        LIMIT ${recentLimit}
      `,
      this.prisma.feedback.groupBy({
        _count: { _all: true },
        by: ["category"],
        orderBy: { category: "asc" },
      }),
      this.prisma.feedback.groupBy({
        _count: { _all: true },
        by: ["rating"],
        orderBy: { rating: "asc" },
      }),
      this.prisma.feedback.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          category: true,
          createdAt: true,
          pagePath: true,
          rating: true,
        },
        take: recentLimit,
      }),
    ]);

    return {
      feedbackByCategory,
      feedbackByRating,
      recentConversations,
      recentFeedback,
      recentUsers,
      totals: {
        conversations: conversationCount,
        feedback: feedbackCount,
        messages: messageCount,
        users: userCount,
      },
    };
  }
}
