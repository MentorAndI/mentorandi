import { GoalStatus } from "@/lib/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import type { CreateGoalInput } from "@/services/goal/goal.types";

export class GoalRepository {
  private readonly prisma = getPrismaClient();

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async findActiveGoalsForUser(userId: string, limit?: number) {
    return this.prisma.goal.findMany({
      orderBy: [
        { targetDate: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      ...(limit !== undefined ? { take: limit } : {}),
      where: {
        status: GoalStatus.ACTIVE,
        userId,
      },
    });
  }

  async createGoalForUser(userId: string, input: CreateGoalInput) {
    return this.prisma.goal.create({
      data: {
        description: input.description,
        status: input.status ?? GoalStatus.ACTIVE,
        targetDate: input.targetDate ?? null,
        title: input.title,
        userId,
      },
    });
  }
}
