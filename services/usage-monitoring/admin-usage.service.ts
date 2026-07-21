import { AdminUsageRepository } from "@/services/usage-monitoring/admin-usage.repository";
import type {
  AdminUsageGroup,
  AdminUsageOverview,
} from "@/services/usage-monitoring/usage-monitoring.types";

export class AdminUsageService {
  constructor(private readonly repository = new AdminUsageRepository()) {}

  async getOverview(): Promise<AdminUsageOverview> {
    const data = await this.repository.getOverview();
    const mentorNames = new Map(
      data.mentors.map((mentor) => [mentor.id, mentor.name]),
    );

    return {
      blockedCount: data.blockedCount,
      byMentor: data.byMentorId.map((entry) => ({
        count: readCount(entry._count),
        estimatedCostUsd: readEstimatedCostSum(entry._sum),
        label: entry.mentorId
          ? (mentorNames.get(entry.mentorId) ?? "Unknown mentor")
          : "Mentor unavailable",
      })),
      byModel: mapGroups(data.byModel, "model", "Unknown model"),
      byProvider: mapGroups(
        data.byProvider,
        "provider",
        "Unknown provider",
      ),
      periods: {
        last30Days: toPeriod(data.periods.last30Days),
        last7Days: toPeriod(data.periods.last7Days),
        today: toPeriod(data.periods.today),
      },
      recentEvents: data.recentEvents.map((event) => ({
        createdAt: event.createdAt.toISOString(),
        errorCode: event.errorCode,
        estimatedCostUsd:
          event.estimatedCostUsd === null
            ? null
            : readDecimal(event.estimatedCostUsd),
        mentor:
          event.mentor?.name ??
          event.conversation?.mentor.name ??
          "Mentor unavailable",
        model: event.model ?? "—",
        provider: event.provider ?? "—",
        route: event.route ?? "—",
        status: event.status,
        totalTokens: event.totalTokens,
      })),
      tokenAverages: {
        last24Hours: toTokenAverage(data.tokenAverages.last24Hours),
        last7Days: toTokenAverage(data.tokenAverages.last7Days),
      },
    };
  }
}

function toTokenAverage(value: {
  _avg: { inputTokens: number | null; outputTokens: number | null };
}) {
  return {
    inputTokens: Math.round(value._avg.inputTokens ?? 0),
    outputTokens: Math.round(value._avg.outputTokens ?? 0),
  };
}

function mapGroups<
  T extends {
    _count: unknown;
    _sum?: unknown;
    model?: string | null;
    provider?: string | null;
  },
>(
  entries: T[],
  key: "model" | "provider",
  fallback: string,
): AdminUsageGroup[] {
  return entries.map((entry) => ({
    count: readCount(entry._count),
    estimatedCostUsd: readEstimatedCostSum(entry._sum),
    label: entry[key] ?? fallback,
  }));
}

function toPeriod(value: {
  _count: unknown;
  _sum?: unknown;
}) {
  return {
    estimatedCostUsd: readEstimatedCostSum(value._sum),
    messageCount: readCount(value._count),
  };
}

function readCount(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "_all" in value &&
    typeof value._all === "number"
  ) {
    return value._all;
  }

  return 0;
}

function readDecimal(value: unknown) {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function readEstimatedCostSum(value: unknown) {
  if (value && typeof value === "object" && "estimatedCostUsd" in value) {
    return readDecimal(value.estimatedCostUsd);
  }

  return 0;
}
