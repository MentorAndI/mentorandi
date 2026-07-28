import { UsageEventStatus } from "@/lib/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import type {
  PersistentUsageCounts,
  UsageEventWriteInput,
} from "@/services/usage-monitoring/usage-monitoring.types";

export class UsageMonitoringRepository {
  private readonly prisma = getPrismaClient();

  async getSuccessfulUsageCounts(
    userId: string,
    now = new Date(),
  ): Promise<PersistentUsageCounts> {
    const periods = getUtcPeriodStarts(now);
    const successful = { status: UsageEventStatus.SUCCESS, userId } as const;
    const [daily, weekly, monthly, deepWeekly] = await this.prisma.$transaction([
      this.prisma.usageEvent.count({
        where: { ...successful, createdAt: { gte: periods.daily } },
      }),
      this.prisma.usageEvent.count({
        where: { ...successful, createdAt: { gte: periods.weekly } },
      }),
      this.prisma.usageEvent.count({
        where: { ...successful, createdAt: { gte: periods.monthly } },
      }),
      this.prisma.usageEvent.count({
        where: {
          ...successful,
          createdAt: { gte: periods.weekly },
          route: "deep",
        },
      }),
    ]);

    return { daily, deepWeekly, monthly, weekly };
  }

  async createUsageEvent(input: UsageEventWriteInput) {
    return this.prisma.usageEvent.create({
      data: {
        conversationId: input.conversationId,
        errorCode: input.errorCode,
        estimatedCostUsd: input.estimatedCostUsd,
        inputTokens: input.inputTokens,
        mentorId: input.mentorId,
        model: input.model,
        outputTokens: input.outputTokens,
        provider: input.provider,
        route: input.route,
        selectedKnowledgeSlugs:
          input.specialistContext?.knowledgeCards.map((card) => card.slug) ?? [],
        selectedKnowledgeTitles:
          input.specialistContext?.knowledgeCards.map((card) => card.title) ?? [],
        selectedSafetyRuleSlugs:
          input.specialistContext?.safetyRules.map((rule) => rule.slug) ?? [],
        selectedSafetyRuleTitles:
          input.specialistContext?.safetyRules.map((rule) => rule.title) ?? [],
        selectedTechniqueSlugs:
          input.specialistContext?.techniques.map((technique) => technique.slug) ??
          [],
        selectedTechniqueTitles:
          input.specialistContext?.techniques.map(
            (technique) => technique.title,
          ) ?? [],
        specialistPackName: input.specialistContext?.displayName,
        specialistPackSlug: input.specialistContext?.packSlug,
        specialistPackVersion: input.specialistContext?.version,
        specialistPromptTokens: input.specialistContext?.estimatedTokens,
        status: input.status,
        totalTokens: input.totalTokens,
        userId: input.userId,
      },
      select: { id: true },
    });
  }

  async findMentorIdForConversation(conversationId?: string) {
    if (!conversationId) {
      return undefined;
    }

    const conversation = await this.prisma.conversation.findUnique({
      select: { mentorId: true },
      where: { id: conversationId },
    });

    return conversation?.mentorId;
  }
}

export function getUtcPeriodStarts(now: Date) {
  const daily = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const day = daily.getUTCDay() || 7;
  const weekly = new Date(daily);
  weekly.setUTCDate(weekly.getUTCDate() - day + 1);
  const monthly = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  return { daily, monthly, weekly };
}
