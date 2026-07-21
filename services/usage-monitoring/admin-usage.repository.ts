import { UsageEventStatus } from "@/lib/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { getUtcPeriodStarts } from "@/services/usage-monitoring/usage-monitoring.repository";

const recentEventLimit = 50;

export class AdminUsageRepository {
  private readonly prisma = getPrismaClient();

  async getOverview(now = new Date()) {
    const utc = getUtcPeriodStarts(now);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const success = UsageEventStatus.SUCCESS;
    const [
      today,
      sevenDays,
      thirtyDays,
      blockedCount,
      byProvider,
      byModel,
      byMentorId,
      recentEvents,
      tokenAverages24Hours,
      tokenAverages7Days,
    ] = await this.prisma.$transaction([
      this.prisma.usageEvent.aggregate({
        _count: { _all: true },
        _sum: { estimatedCostUsd: true },
        where: { createdAt: { gte: utc.daily }, status: success },
      }),
      this.prisma.usageEvent.aggregate({
        _count: { _all: true },
        _sum: { estimatedCostUsd: true },
        where: { createdAt: { gte: last7Days }, status: success },
      }),
      this.prisma.usageEvent.aggregate({
        _count: { _all: true },
        _sum: { estimatedCostUsd: true },
        where: { createdAt: { gte: last30Days }, status: success },
      }),
      this.prisma.usageEvent.count({
        where: { status: UsageEventStatus.BLOCKED },
      }),
      this.prisma.usageEvent.groupBy({
        _count: { _all: true },
        _sum: { estimatedCostUsd: true },
        by: ["provider"],
        orderBy: { provider: "asc" },
        where: { createdAt: { gte: last30Days }, status: success },
      }),
      this.prisma.usageEvent.groupBy({
        _count: { _all: true },
        _sum: { estimatedCostUsd: true },
        by: ["model"],
        orderBy: { model: "asc" },
        where: { createdAt: { gte: last30Days }, status: success },
      }),
      this.prisma.usageEvent.groupBy({
        _count: { _all: true },
        _sum: { estimatedCostUsd: true },
        by: ["mentorId"],
        orderBy: { mentorId: "asc" },
        where: { createdAt: { gte: last30Days }, status: success },
      }),
      this.prisma.usageEvent.findMany({
        include: {
          conversation: { select: { mentor: { select: { name: true } } } },
          mentor: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: recentEventLimit,
      }),
      this.prisma.usageEvent.aggregate({
        _avg: { inputTokens: true, outputTokens: true },
        where: { createdAt: { gte: last24Hours }, status: success },
      }),
      this.prisma.usageEvent.aggregate({
        _avg: { inputTokens: true, outputTokens: true },
        where: { createdAt: { gte: last7Days }, status: success },
      }),
    ]);
    const mentorIds = byMentorId
      .map((entry) => entry.mentorId)
      .filter((id): id is string => Boolean(id));
    const mentors = await this.prisma.mentor.findMany({
      select: { id: true, name: true },
      where: { id: { in: mentorIds } },
    });

    return {
      blockedCount,
      byMentorId,
      byModel,
      byProvider,
      mentors,
      periods: { last30Days: thirtyDays, last7Days: sevenDays, today },
      recentEvents,
      tokenAverages: {
        last24Hours: tokenAverages24Hours,
        last7Days: tokenAverages7Days,
      },
    };
  }
}
