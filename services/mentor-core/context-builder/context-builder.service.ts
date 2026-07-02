import { ContextBuilderRepository } from "@/services/mentor-core/context-builder/context-builder.repository";
import { MemoryService } from "@/services/memory/memory.service";
import type {
  BuildMentorContextAuthContext,
  BuildMentorContextInput,
  MentorContextMemory,
  MentorResponseContext,
  RecommendedMentorFocus,
} from "@/services/mentor-core/context-builder/context-builder.types";

const recentMessageLimit = 16;
const relevantMemoryLimit = 10;
const minimumMemoryConfidence = 0.6;
const minimumMemoryImportance = 3;
const activeGoalLimit = 8;
const recentReflectionLimit = 5;

export class ContextBuilderServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ContextBuilderServiceError";
  }
}

export class ContextBuilderService {
  constructor(
    private readonly repository = new ContextBuilderRepository(),
    private readonly memoryService = new MemoryService(),
  ) {}

  async buildMentorContext(
    input: BuildMentorContextInput,
    authContext: BuildMentorContextAuthContext,
  ): Promise<MentorResponseContext> {
    this.assertCanBuildContextForUser(input.userId, authContext);

    const user = await this.repository.findUserById(input.userId);

    if (!user) {
      throw new ContextBuilderServiceError("User was not found.", 404);
    }

    const conversation = await this.repository.findConversationForUser(
      input.conversationId,
      user.id,
    );

    if (!conversation) {
      throw new ContextBuilderServiceError(
        "Conversation was not found for this user.",
        404,
      );
    }

    const [recentMessages, relevantMemories, activeGoals, recentReflections] =
      await Promise.all([
        this.repository.findRecentMessages(conversation.id, recentMessageLimit),
        this.memoryService.listRelevantMentorUnderstandingsForUserId(
          user.id,
          {
            minimumConfidence: minimumMemoryConfidence,
            minimumImportance: minimumMemoryImportance,
          },
          relevantMemoryLimit,
        ),
        this.repository.findActiveGoals(user.id, activeGoalLimit),
        this.repository.findRecentReflections(user.id, recentReflectionLimit),
      ]);
    const contextMemories = relevantMemories.map(toContextMemory);

    return {
      conversation: {
        createdAt: conversation.createdAt.toISOString(),
        id: conversation.id,
        updatedAt: conversation.updatedAt.toISOString(),
      },
      currentUserMessage: input.currentMessage ?? null,
      memories: contextMemories,
      mentor: {
        active: conversation.mentor.active,
        description: conversation.mentor.description,
        id: conversation.mentor.id,
        name: conversation.mentor.name,
        slug: conversation.mentor.slug,
      },
      recentMessages: recentMessages.map((message) => ({
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        id: message.id,
        role: message.role,
      })),
      recentReflections: recentReflections.map((reflection) => ({
        createdAt: reflection.createdAt.toISOString(),
        id: reflection.id,
        summary: reflection.summary,
      })),
      recommendedMentorFocus: buildRecommendedMentorFocus({
        activeGoalCount: activeGoals.length,
        currentMessage: input.currentMessage,
        relevantMemoryCount: relevantMemories.length,
        recentReflectionCount: recentReflections.length,
      }),
      relevantMemories: contextMemories,
      user: {
        authUserId: user.authUserId,
        id: user.id,
      },
      userGoals: activeGoals.map((goal) => ({
        description: goal.description,
        id: goal.id,
        status: goal.status,
        targetDate: goal.targetDate?.toISOString() ?? null,
        title: goal.title,
      })),
    };
  }

  private assertCanBuildContextForUser(
    _userId: string,
    authContext: BuildMentorContextAuthContext,
  ) {
    void authContext;
  }
}

function toContextMemory(memory: {
  category: string;
  confidence: number;
  content: string;
  id: string;
  importance: number;
  sourceConversationId: string | null;
  title: string;
  updatedAt: string;
}): MentorContextMemory {
  return {
    category: memory.category,
    confidence: memory.confidence,
    content: memory.content,
    id: memory.id,
    importance: memory.importance,
    sourceConversationId: memory.sourceConversationId,
    title: memory.title,
    updatedAt: memory.updatedAt,
  };
}

// The Context Builder returns structured context, not a prompt.
function buildRecommendedMentorFocus(input: {
  activeGoalCount: number;
  currentMessage?: string;
  relevantMemoryCount: number;
  recentReflectionCount: number;
}): RecommendedMentorFocus {
  const priorities: string[] = [];

  if (input.currentMessage) {
    priorities.push("respond-to-current-user-message");
  }

  if (input.relevantMemoryCount > 0) {
    priorities.push("use-established-understanding-of-user");
  }

  if (input.activeGoalCount > 0) {
    priorities.push("support-active-goals-and-accountability");
  }

  if (input.recentReflectionCount > 0) {
    priorities.push("consider-recent-reflection-patterns");
  }

  if (priorities.length === 0) {
    priorities.push("establish-understanding-before-guidance");
  }

  return {
    priorities,
    summary:
      "Use the assembled context to understand what matters before deciding how to respond.",
  };
}
