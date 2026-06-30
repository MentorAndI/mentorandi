import { ConversationRepository } from "@/services/conversation/conversation.repository";
import type {
  AuthenticatedConversationUser,
  ConversationDto,
  CreateConversationInput,
} from "@/services/conversation/conversation.types";

export class ConversationServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ConversationServiceError";
  }
}

export class ConversationService {
  constructor(
    private readonly repository = new ConversationRepository(),
  ) {}

  async getConversationsForUser(
    authenticatedUser: AuthenticatedConversationUser,
  ): Promise<ConversationDto[]> {
    const user = await this.ensureUser(authenticatedUser.authUserId);
    const conversations =
      await this.repository.findConversationsByUserId(user.id);

    return conversations.map(toConversationDto);
  }

  async createConversation(
    authenticatedUser: AuthenticatedConversationUser,
    input: CreateConversationInput,
  ): Promise<ConversationDto> {
    const user = await this.ensureUser(authenticatedUser.authUserId);
    const mentor = await this.repository.findActiveMentorById(input.mentorId);

    if (!mentor) {
      throw new ConversationServiceError(
        "Mentor was not found or is not available.",
        404,
      );
    }

    const conversation = await this.repository.createConversation(
      user.id,
      mentor.id,
    );

    return toConversationDto(conversation);
  }

  private async ensureUser(authUserId: string) {
    const existingUser =
      await this.repository.findUserByAuthUserId(authUserId);

    if (existingUser) {
      return existingUser;
    }

    return this.repository.createUserForAuthUser(authUserId);
  }
}

function toConversationDto(conversation: {
  createdAt: Date;
  id: string;
  mentor: {
    description: string;
    id: string;
    name: string;
    slug: string;
  };
  updatedAt: Date;
}): ConversationDto {
  return {
    createdAt: conversation.createdAt.toISOString(),
    id: conversation.id,
    mentor: conversation.mentor,
    updatedAt: conversation.updatedAt.toISOString(),
  };
}
