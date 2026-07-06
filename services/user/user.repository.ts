import { getPrismaClient } from "@/lib/prisma";

export class UserRepository {
  private readonly prisma = getPrismaClient();

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async findUserByAuthUserId(authUserId: string) {
    return this.prisma.user.findUnique({
      where: {
        authUserId,
      },
    });
  }

  async upsertUserByAuthUserId(authUserId: string) {
    return this.prisma.user.upsert({
      create: {
        authUserId,
      },
      update: {},
      where: {
        authUserId,
      },
    });
  }
}
