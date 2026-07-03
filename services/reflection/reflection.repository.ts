import { getPrismaClient } from "@/lib/prisma";
import type { CreateReflectionInput } from "@/services/reflection/reflection.types";

export class ReflectionRepository {
  private readonly prisma = getPrismaClient();

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async createReflectionForUser(
    userId: string,
    input: CreateReflectionInput,
  ) {
    return this.prisma.reflection.create({
      data: {
        summary: input.summary,
        userId,
      },
    });
  }
}
