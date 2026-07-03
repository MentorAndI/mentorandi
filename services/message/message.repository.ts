import { getPrismaClient } from "@/lib/prisma";
import type { CreateMessageInput } from "@/services/message/message.types";

export class MessageRepository {
  private readonly prisma = getPrismaClient();

  async findConversationById(conversationId: string) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
  }

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
    return this.prisma.message.create({
      data: {
        content: input.content,
        conversationId,
        role: input.role,
      },
    });
  }
}
