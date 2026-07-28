import { UsageEventStatus } from "@/lib/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";

const recentSelectionLimit = 100;

export class AdminSpecialistObservabilityRepository {
  listRecentSelections() {
    return getPrismaClient().usageEvent.findMany({
      include: {
        conversation: {
          select: {
            mentor: { select: { name: true, slug: true } },
          },
        },
        mentor: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: recentSelectionLimit,
      where: {
        conversationId: { not: null },
        status: UsageEventStatus.SUCCESS,
      },
    });
  }
}
