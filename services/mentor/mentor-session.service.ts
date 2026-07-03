import { getPrismaClient } from "@/lib/prisma";
import { ConversationService } from "@/services/conversation/conversation.service";
import { UserService } from "@/services/user/user.service";
import type { UserDto } from "@/services/user/user.types";

export interface MentorSessionDto {
  conversation: {
    id: string;
  };
  mentor: {
    name: string;
    role: string;
    tagline: string;
  };
}

export interface DevelopmentMentorSession extends MentorSessionDto {
  authUserId: string;
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
  constructor(private readonly userService = new UserService()) {}

  async getMarcusSessionForUser(user: UserDto): Promise<DevelopmentMentorSession> {
    const prisma = getPrismaClient();
    const mentor = await prisma.mentor.findUnique({
      select: {
        id: true,
        name: true,
      },
      where: {
        slug: marcusSlug,
      },
    });

    if (!mentor) {
      throw new MentorSessionServiceError(
        "Marcus mentor session was not found.",
        404,
      );
    }

    const existingConversation = await prisma.conversation.findFirst({
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
      },
      where: {
        mentorId: mentor.id,
        userId: user.id,
      },
    });

    const conversation = existingConversation
      ? existingConversation
      : await new ConversationService().createConversationForUserId(user.id, {
          mentorId: mentor.id,
        });

    return {
      authUserId: user.authUserId,
      conversation: {
        id: conversation.id,
      },
      mentor: {
        name: mentor.name,
        role: marcusRole,
        tagline: marcusTagline,
      },
      mentorId: mentor.id,
      userId: user.id,
    };
  }

  async getResolvedMarcusSession(): Promise<DevelopmentMentorSession> {
    const user = await this.userService.resolveCurrentUser();

    return this.getMarcusSessionForUser(user);
  }

  async getDevelopmentMarcusSession(): Promise<DevelopmentMentorSession> {
    const user = await this.userService.getDevelopmentUser();

    return this.getMarcusSessionForUser(user);
  }
}
