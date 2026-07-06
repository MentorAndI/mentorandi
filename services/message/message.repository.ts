import { getPrismaClient } from "@/lib/prisma";
import type { CreateMessageInput } from "@/services/message/message.types";

export class MessageRepository {
  private readonly prisma = getPrismaClient();

  async findConversationForAuthUser(
    conversationId: string,
    authUserId: string,
  ) {
    return this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        user: {
          authUserId,
        },
      },
    });
  }

  async findMessagesByConversationId(conversationId: string) {
    return this.prisma.message.findMany({
      orderBy: {
        createdAt: "asc",
      },
      where: { conversationId },
    });
  }

  async createMessage(conversationId: string, input: CreateMessageInput) {
    const now = new Date();
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          content: input.content,
          conversationId,
          role: input.role,
        },
      }),
      this.prisma.conversation.update({
        data: {
          updatedAt: now,
        },
        where: {
          id: conversationId,
        },
      }),
    ]);

    return message;
  }
}
