import {
  ConversationService,
  ConversationServiceError,
} from "@/services/conversation/conversation.service";
import type { ConversationDto } from "@/services/conversation/conversation.types";
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
