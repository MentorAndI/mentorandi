import { getPrismaClient } from "@/lib/prisma";

export class ConversationRepository {
  private readonly prisma = getPrismaClient();

  async findUserByAuthUserId(authUserId: string) {
    return this.prisma.user.findUnique({
      where: { authUserId },
    });
  }

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
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

  async findActiveMentorBySlug(slug: string) {
    return this.prisma.mentor.findFirst({
      where: {
        active: true,
        slug,
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

  async findConversationForUser(userId: string, conversationId: string) {
    return this.prisma.conversation.findFirst({
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
      where: {
        id: conversationId,
        userId,
      },
    });
  }

  async findLatestConversationForUserAndMentor(
    userId: string,
    mentorId: string,
  ) {
    return this.prisma.conversation.findFirst({
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
      where: {
        mentorId,
        userId,
      },
    });
  }

  async findConversationsForUserAndMentorSlug(
    userId: string,
    mentorSlug: string,
    limit: number,
  ) {
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
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            content: true,
            createdAt: true,
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: limit,
      where: {
        mentor: {
          active: true,
          slug: mentorSlug,
        },
        userId,
      },
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
