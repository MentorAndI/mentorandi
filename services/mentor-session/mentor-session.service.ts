import {
  ConversationService,
  ConversationServiceError,
} from "@/services/conversation/conversation.service";
import type {
  ConversationDto,
  ConversationSummaryDto,
} from "@/services/conversation/conversation.types";
import {
  GoalService,
  GoalServiceError,
} from "@/services/goal/goal.service";
import type { GoalDto } from "@/services/goal/goal.types";
import {
  getActiveMentorProfile,
  getActiveMentorProfileByDatabaseSlug,
  getMentorDisplayName,
} from "@/services/mentor-catalog/mentor-catalog";
import type { ActiveMentorSlug } from "@/services/mentor-catalog/mentor-catalog.types";
import { MentorAccessService } from "@/services/mentor-access/mentor-access.service";
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
    slug: ActiveMentorSlug;
    tagline: string;
  };
  mentorId: string;
  userId: string;
}

export interface MentorSessionOverviewDto {
  activeGoals: GoalDto[];
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

const defaultMentorSlug: ActiveMentorSlug = "life";
const activeGoalLimit = 5;

export class MentorSessionService {
  constructor(
    private readonly userService = new UserService(),
    private readonly conversationService = new ConversationService(),
    private readonly goalService = new GoalService(),
    private readonly mentorAccessService = new MentorAccessService(),
  ) {}

  async getMentorSessionForUser(
    user: UserDto,
    mentorSlug: ActiveMentorSlug,
  ): Promise<MentorSessionDto> {
    try {
      await this.mentorAccessService.assertMentorAccess(user.id, mentorSlug);
      const profile = requireMentorProfile(mentorSlug);
      const conversation =
        await this.conversationService.getOrCreateConversationForUserAndMentorSlug(
          user.id,
          profile.databaseSlug,
        );

      return toMentorSessionDto(user, conversation);
    } catch (error) {
      throw mapConversationError(error);
    }
  }

  async getResolvedMentorSession(
    mentorSlug: ActiveMentorSlug,
  ): Promise<MentorSessionDto> {
    const user = await this.userService.resolveAuthenticatedUser();

    return this.getMentorSessionForUser(user, mentorSlug);
  }

  async getResolvedMentorSessionOverview(
    mentorSlug: ActiveMentorSlug,
  ): Promise<MentorSessionOverviewDto> {
    const user = await this.userService.resolveAuthenticatedUser();
    const session = await this.getMentorSessionForUser(user, mentorSlug);
    const [activeGoals, conversations] = await Promise.all([
      this.listActiveGoalsForUser(user),
      this.listRecentConversationsForUser(user),
    ]);

    return { activeGoals, conversations, session };
  }

  async getResolvedMentorSessionForConversation(
    conversationId: string,
    mentorSlug: ActiveMentorSlug,
  ): Promise<MentorSessionDto> {
    const user = await this.userService.resolveAuthenticatedUser();

    return this.getMentorSessionForConversation(
      user,
      conversationId,
      mentorSlug,
    );
  }

  async getMentorSessionForConversation(
    user: UserDto,
    conversationId: string,
    mentorSlug: ActiveMentorSlug,
  ): Promise<MentorSessionDto> {
    try {
      await this.mentorAccessService.assertMentorAccess(user.id, mentorSlug);
      const profile = requireMentorProfile(mentorSlug);
      const conversation =
        await this.conversationService.getConversationForUserId(
          user.id,
          conversationId,
        );

      if (conversation.mentor.slug !== profile.databaseSlug) {
        throw new MentorSessionServiceError("Conversation was not found.", 404);
      }

      return toMentorSessionDto(user, conversation);
    } catch (error) {
      throw mapConversationError(error);
    }
  }

  async createNewMentorSession(
    mentorSlug: ActiveMentorSlug,
  ): Promise<MentorSessionDto> {
    const user = await this.userService.resolveAuthenticatedUser();

    return this.createNewMentorSessionForUser(user, mentorSlug);
  }

  async createNewMentorSessionForUser(
    user: UserDto,
    mentorSlug: ActiveMentorSlug,
  ): Promise<MentorSessionDto> {
    try {
      await this.mentorAccessService.assertMentorAccess(user.id, mentorSlug);
      const profile = requireMentorProfile(mentorSlug);
      const conversation =
        await this.conversationService.createConversationForUserAndMentorSlug(
          user.id,
          profile.databaseSlug,
        );

      return toMentorSessionDto(user, conversation);
    } catch (error) {
      throw mapConversationError(error);
    }
  }

  // Compatibility helpers keep existing Life/Marcus and dev flows stable.
  async getMarcusSessionForUser(user: UserDto) {
    return this.getMentorSessionForUser(user, defaultMentorSlug);
  }

  async getResolvedMarcusSession() {
    return this.getResolvedMentorSession(defaultMentorSlug);
  }

  async getResolvedMarcusSessionOverview() {
    return this.getResolvedMentorSessionOverview(defaultMentorSlug);
  }

  async getResolvedMarcusSessionForConversation(conversationId: string) {
    return this.getResolvedMentorSessionForConversation(
      conversationId,
      defaultMentorSlug,
    );
  }

  async getMarcusSessionForConversation(
    user: UserDto,
    conversationId: string,
  ) {
    return this.getMentorSessionForConversation(
      user,
      conversationId,
      defaultMentorSlug,
    );
  }

  async createNewMarcusSession() {
    return this.createNewMentorSession(defaultMentorSlug);
  }

  async createNewMarcusSessionForUser(user: UserDto) {
    return this.createNewMentorSessionForUser(user, defaultMentorSlug);
  }

  async getDevelopmentMarcusSession() {
    const user = await this.userService.getDevelopmentUser();

    return this.getMentorSessionForUser(user, defaultMentorSlug);
  }

  private async listRecentConversationsForUser(user: UserDto) {
    try {
      return await this.conversationService.getRecentConversationsForUser(
        user.id,
      );
    } catch (error) {
      throw mapConversationError(error);
    }
  }

  private async listActiveGoalsForUser(user: UserDto) {
    try {
      return await this.goalService.listActiveGoalsForUserId(
        user.id,
        activeGoalLimit,
      );
    } catch (error) {
      if (error instanceof GoalServiceError) {
        throw new MentorSessionServiceError(error.message, error.statusCode);
      }

      throw error;
    }
  }
}

function toMentorSessionDto(
  user: UserDto,
  conversation: ConversationDto,
): MentorSessionDto {
  const profile = getActiveMentorProfileByDatabaseSlug(conversation.mentor.slug);

  if (!profile) {
    throw new MentorSessionServiceError("Mentor was not found.", 404);
  }

  return {
    authUserId: user.authUserId,
    conversation: { id: conversation.id },
    mentor: {
      name: getMentorDisplayName(profile),
      role: profile.name,
      slug: profile.slug,
      tagline: profile.shortDescription,
    },
    mentorId: conversation.mentor.id,
    userId: user.id,
  };
}

function requireMentorProfile(slug: ActiveMentorSlug) {
  const profile = getActiveMentorProfile(slug);

  if (!profile) {
    throw new MentorSessionServiceError("Mentor was not found.", 404);
  }

  return profile;
}

function mapConversationError(error: unknown) {
  if (error instanceof ConversationServiceError) {
    return new MentorSessionServiceError(error.message, error.statusCode);
  }

  return error;
}
