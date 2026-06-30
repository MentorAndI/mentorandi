import { getPrismaClient } from "@/lib/prisma";

export class ConversationRepository {
  private readonly prisma = getPrismaClient();

  async findUserByAuthUserId(authUserId: string) {
    return this.prisma.user.findUnique({
      where: { authUserId },
    });
  }

  async createUserForAuthUser(authUserId: string) {
    return this.prisma.user.create({
      data: { authUserId },
    });
  }

  async findActiveMentorById(mentorId: string) {
    return this.prisma.mentor.findFirst({
      where: {
        active: true,
        id: mentorId,
      },
    });
  }

  async findConversationsByUserId(userId: string) {
    return this.prisma.conversation.findMany({
      include: {
        mentor: {
          select: {
            description: true,
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      where: { userId },
    });
  }

  async createConversation(userId: string, mentorId: string) {
    return this.prisma.conversation.create({
      data: {
        mentorId,
        userId,
      },
      include: {
        mentor: {
          select: {
            description: true,
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }
}
