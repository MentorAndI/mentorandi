import { MessageRepository } from "@/services/message/message.repository";
import type {
  CreateMessageInput,
  MessageAuthContext,
  MessageDto,
} from "@/services/message/message.types";

export class MessageServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "MessageServiceError";
  }
}

export class MessageService {
  constructor(private readonly repository = new MessageRepository()) {}

  async getMessagesForConversation(
    conversationId: string,
    authContext: MessageAuthContext,
  ): Promise<MessageDto[]> {
    await this.ensureCanAccessConversation(conversationId, authContext);

    const messages =
      await this.repository.findMessagesByConversationId(conversationId);

    return messages.map(toMessageDto);
  }

  async createMessage(
    conversationId: string,
    input: CreateMessageInput,
    authContext: MessageAuthContext,
  ): Promise<MessageDto> {
    await this.ensureCanAccessConversation(conversationId, authContext);

    const message = await this.repository.createMessage(conversationId, input);

    return toMessageDto(message);
  }

  private async ensureCanAccessConversation(
    conversationId: string,
    authContext: MessageAuthContext,
  ) {
    if (!authContext.authUserId) {
      return this.ensureConversationExists(conversationId);
    }

    const conversation = await this.repository.findConversationForAuthUser(
      conversationId,
      authContext.authUserId,
    );

    if (!conversation) {
      throw new MessageServiceError("Conversation was not found.", 404);
    }

    return conversation;
  }

  private async ensureConversationExists(conversationId: string) {
    const conversation =
      await this.repository.findConversationById(conversationId);

    if (!conversation) {
      throw new MessageServiceError("Conversation was not found.", 404);
    }

    return conversation;
  }
}

function toMessageDto(message: {
  content: string;
  conversationId: string;
  createdAt: Date;
  id: string;
  role: MessageDto["role"];
}): MessageDto {
  return {
    content: message.content,
    conversationId: message.conversationId,
    createdAt: message.createdAt.toISOString(),
    id: message.id,
    role: message.role,
  };
}
