import { getPrismaClient } from "@/lib/prisma";

export class EntitlementRepository {
  private readonly prisma = getPrismaClient();

  findSubscriptionForUser(userId: string) {
    return this.prisma.subscription.findUnique({
      select: { plan: true, status: true },
      where: { userId },
    });
  }
}
