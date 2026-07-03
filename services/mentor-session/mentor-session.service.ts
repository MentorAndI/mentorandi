import {
  ConversationService,
  ConversationServiceError,
} from "@/services/conversation/conversation.service";
import type {
  ConversationDto,
  ConversationSummaryDto,
} from "@/services/conversation/conversation.types";
import { UserService } from "@/services/user/user.service";
import type { UserDto } from "@/services/user/user.types";

export interface MentorSessionDto {
  authUserId: string;
  conversation: {
    id: string;
  };
  mentor: {
    name: string;
    role: string;
    tagline: string;
  };
  mentorId: string;
  userId: string;
}

export interface MentorSessionOverviewDto {
  conversations: ConversationSummaryDto[];
  session: MentorSessionDto;
}

export class MentorSessionServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "MentorSessionServiceError";
  }
}

const marcusSlug = "marcus";
const marcusRole = "Strategic Mentor";
const marcusTagline = "Focused thinking. Better decisions. Long-term growth.";

export class MentorSessionService {
  constructor(
    private readonly userService = new UserService(),
    private readonly conversationService = new ConversationService(),
  ) {}

  async getMarcusSessionForUser(user: UserDto): Promise<MentorSessionDto> {
    try {
      const conversation =
        await this.conversationService.getOrCreateConversationForUserAndMentorSlug(
          user.id,
          marcusSlug,
        );

      return toMentorSessionDto(user, conversation);
    } catch (error) {
      if (error instanceof ConversationServiceError) {
        throw new MentorSessionServiceError(
          error.message,
          error.statusCode,
        );
      }

      throw error;
    }
  }

  async getResolvedMarcusSession(): Promise<MentorSessionDto> {
    const user = await this.userService.resolveCurrentUser();

    return this.getMarcusSessionForUser(user);
  }

  async getResolvedMarcusSessionOverview(): Promise<MentorSessionOverviewDto> {
    const user = await this.userService.resolveCurrentUser();
    const session = await this.getMarcusSessionForUser(user);
    const conversations = await this.listMarcusConversationsForUser(user);

    return {
      conversations,
      session,
    };
  }

  async getResolvedMarcusSessionForConversation(
    conversationId: string,
  ): Promise<MentorSessionDto> {
    const user = await this.userService.resolveCurrentUser();

    return this.getMarcusSessionForConversation(user, conversationId);
  }

  async getMarcusSessionForConversation(
    user: UserDto,
    conversationId: string,
  ): Promise<MentorSessionDto> {
    try {
      const conversation =
        await this.conversationService.getConversationForUserId(
          user.id,
          conversationId,
        );

      if (conversation.mentor.slug !== marcusSlug) {
        throw new MentorSessionServiceError(
          "Conversation was not found.",
          404,
        );
      }

      return toMentorSessionDto(user, conversation);
    } catch (error) {
      if (error instanceof ConversationServiceError) {
        throw new MentorSessionServiceError(
          error.message,
          error.statusCode,
        );
      }

      throw error;
    }
  }

  async createNewMarcusSession(): Promise<MentorSessionDto> {
    const user = await this.userService.resolveCurrentUser();

    return this.createNewMarcusSessionForUser(user);
  }

  async createNewMarcusSessionForUser(user: UserDto): Promise<MentorSessionDto> {
    try {
      const conversation =
        await this.conversationService.createConversationForUserAndMentorSlug(
          user.id,
          marcusSlug,
        );

      return toMentorSessionDto(user, conversation);
    } catch (error) {
      if (error instanceof ConversationServiceError) {
        throw new MentorSessionServiceError(
          error.message,
          error.statusCode,
        );
      }

      throw error;
    }
  }

  async getDevelopmentMarcusSession(): Promise<MentorSessionDto> {
    const user = await this.userService.getDevelopmentUser();

    return this.getMarcusSessionForUser(user);
  }

  private async listMarcusConversationsForUser(
    user: UserDto,
  ): Promise<ConversationSummaryDto[]> {
    try {
      return this.conversationService.getRecentConversationsForUserAndMentorSlug(
        user.id,
        marcusSlug,
      );
    } catch (error) {
      if (error instanceof ConversationServiceError) {
        throw new MentorSessionServiceError(
          error.message,
          error.statusCode,
        );
      }

      throw error;
    }
  }
}

function toMentorSessionDto(
  user: UserDto,
  conversation: ConversationDto,
): MentorSessionDto {
  return {
    authUserId: user.authUserId,
    conversation: {
      id: conversation.id,
    },
    mentor: {
      name: conversation.mentor.name,
      role: marcusRole,
      tagline: marcusTagline,
    },
    mentorId: conversation.mentor.id,
    userId: user.id,
  };
}
