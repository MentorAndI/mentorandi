import { getPrismaClient } from "@/lib/prisma";
import { ConversationService } from "@/services/conversation/conversation.service";

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
const testAuthUserId = "00000000-0000-0000-0000-000000000001";
const marcusRole = "Strategic Mentor";
const marcusTagline = "Focused thinking. Better decisions. Long-term growth.";

export class MentorSessionService {
  async getDevelopmentMarcusSession(): Promise<DevelopmentMentorSession> {
    const prisma = getPrismaClient();
    const [user, mentor] = await Promise.all([
      prisma.user.findUnique({
        select: {
          id: true,
        },
        where: {
          authUserId: testAuthUserId,
        },
      }),
      prisma.mentor.findUnique({
        select: {
          id: true,
          name: true,
        },
        where: {
          slug: marcusSlug,
        },
      }),
    ]);

    if (!user || !mentor) {
      throw new MentorSessionServiceError(
        "Seeded development mentor session was not found.",
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
}
