import { AdminOverviewRepository } from "@/services/admin/admin-overview.repository";
import type { AdminOverview } from "@/services/admin/admin-overview.types";

const recentItemLimit = 10;

export class AdminOverviewService {
  constructor(
    private readonly repository = new AdminOverviewRepository(),
  ) {}

  async getOverview(): Promise<AdminOverview> {
    const data = await this.repository.getOverviewData(recentItemLimit);

    return {
      feedbackSummary: {
        byCategory: data.feedbackByCategory.map((entry) => ({
          count: readGroupCount(entry._count),
          label: entry.category,
        })),
        byRating: data.feedbackByRating.map((entry) => ({
          count: readGroupCount(entry._count),
          label: entry.rating,
        })),
        recent: data.recentFeedback.map((entry) => ({
          category: entry.category,
          createdAt: entry.createdAt.toISOString(),
          pagePath: entry.pagePath,
          rating: entry.rating,
        })),
      },
      recentConversations: data.recentConversations.map((conversation) => ({
        ...conversation,
        createdAt: conversation.createdAt.toISOString(),
        email: conversation.email ?? "Email unavailable",
        updatedAt: conversation.updatedAt.toISOString(),
      })),
      recentUsers: data.recentUsers.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        email: user.email ?? "Email unavailable",
        lastActivityAt: user.lastActivityAt.toISOString(),
      })),
      totals: data.totals,
    };
  }
}

function readGroupCount(value: true | { _all?: number } | undefined) {
  return typeof value === "object" ? (value._all ?? 0) : 0;
}
