import { ContextBuilderRepository } from "@/services/mentor-core/context-builder/context-builder.repository";
import { getLlmCostControls } from "@/services/llm/llm-cost-controls";
import { MemoryService } from "@/services/memory/memory.service";
import {
  ReflectionService,
  ReflectionServiceError,
} from "@/services/reflection/reflection.service";
import type {
  BuildMentorContextAuthContext,
  BuildMentorContextInput,
  MentorContextEnvironment,
  MentorContextGoal,
  MentorContextMemory,
  MentorContextMessage,
  MentorContextReflection,
  MentorResponseContext,
  RecommendedMentorFocus,
} from "@/services/mentor-core/context-builder/context-builder.types";

const minimumMemoryConfidence = 0.6;
const minimumMemoryImportance = 3;

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
    private readonly reflectionService = new ReflectionService(),
  ) {}

  async buildMentorContext(
    input: BuildMentorContextInput,
    authContext: BuildMentorContextAuthContext,
  ): Promise<MentorResponseContext> {
    const user = await this.repository.findUserById(input.userId);

    if (!user) {
      throw new ContextBuilderServiceError("User was not found.", 404);
    }

    this.assertCanBuildContextForUser(user.authUserId, authContext);

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

    const contextSources = await this.loadContextSources(
      user.id,
      conversation.id,
    );
    const {
      activeGoals,
      recentMessages,
      recentReflections,
      relevantMemories,
    } = contextSources;
    let contextMessages = recentMessages.items.map((message) => ({
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      role: message.role,
    }));
    let contextMemories = relevantMemories.items.map(toContextMemory);
    let contextGoals = activeGoals.items.map((goal) => ({
      description: goal.description,
      id: goal.id,
      status: goal.status,
      targetDate: goal.targetDate?.toISOString() ?? null,
      title: goal.title,
    }));
    let contextReflections = recentReflections.items.map((reflection) => ({
      createdAt: reflection.createdAt,
      id: reflection.id,
      summary: reflection.summary,
    }));
    const controls = getLlmCostControls();
    const budgetResult = trimContextToBudget(
      {
        currentMessage: input.currentMessage ?? null,
        recentMessages: contextMessages,
        recentReflections: contextReflections,
        relevantMemories: contextMemories,
        userGoals: contextGoals,
      },
      controls.contextBudgetTokens,
    );

    contextMessages = budgetResult.recentMessages;
    contextMemories = budgetResult.relevantMemories;
    contextGoals = budgetResult.userGoals;
    contextReflections = budgetResult.recentReflections;

    const environment = buildEnvironmentContext();
    const contextWasTrimmed =
      budgetResult.wasTrimmed ||
      recentMessages.available > contextMessages.length ||
      relevantMemories.available > contextMemories.length ||
      activeGoals.available > contextGoals.length ||
      recentReflections.available > contextReflections.length;

    return {
      conversation: {
        createdAt: conversation.createdAt.toISOString(),
        id: conversation.id,
        updatedAt: conversation.updatedAt.toISOString(),
      },
      currentUserMessage: input.currentMessage ?? null,
      diagnostics: {
        contextBudgetTokens: controls.contextBudgetTokens,
        goals: {
          available: activeGoals.available,
          included: contextGoals.length,
          limit: controls.goalsLimit,
        },
        maxOutputTokens: controls.maxOutputTokens,
        memories: {
          available: relevantMemories.available,
          included: contextMemories.length,
          limit: controls.memoriesLimit,
        },
        recentMessages: {
          available: recentMessages.available,
          included: contextMessages.length,
          limit: controls.recentMessagesLimit,
        },
        reflections: {
          available: recentReflections.available,
          included: contextReflections.length,
          limit: controls.reflectionsLimit,
        },
        wasTrimmed: contextWasTrimmed,
      },
      environment,
      goals: contextGoals,
      memories: contextMemories,
      mentor: {
        active: conversation.mentor.active,
        description: conversation.mentor.description,
        id: conversation.mentor.id,
        name: conversation.mentor.name,
        slug: conversation.mentor.slug,
      },
      recentMessages: contextMessages,
      recentReflections: contextReflections,
      recommendedMentorFocus: buildRecommendedMentorFocus({
        activeGoalCount: contextGoals.length,
        currentMessage: input.currentMessage,
        relevantMemoryCount: contextMemories.length,
        recentReflectionCount: contextReflections.length,
      }),
      relevantMemories: contextMemories,
      user: {
        authUserId: user.authUserId,
        id: user.id,
      },
      userGoals: contextGoals,
    };
  }

  private async loadContextSources(userId: string, conversationId: string) {
    const controls = getLlmCostControls();
    const memoryFilters = {
      minimumConfidence: minimumMemoryConfidence,
      minimumImportance: minimumMemoryImportance,
    };

    const [
      recentMessageItems,
      relevantMemoryItems,
      activeGoalItems,
      recentReflectionItems,
      recentMessageAvailableCount,
      relevantMemoryAvailableCount,
      activeGoalAvailableCount,
      recentReflectionAvailableCount,
    ] =
      await Promise.all([
        this.repository.findRecentMessages(
          conversationId,
          controls.recentMessagesLimit,
        ),
        this.memoryService.listRelevantMentorUnderstandingsForUserId(
          userId,
          memoryFilters,
          controls.memoriesLimit,
        ),
        this.repository.findActiveGoals(userId, controls.goalsLimit),
        this.reflectionService.listRecentReflectionsForUserId(
          userId,
          controls.reflectionsLimit,
        ),
        this.repository.countMessagesForConversation(conversationId),
        this.memoryService.countRelevantMentorUnderstandingsForUserId(
          userId,
          memoryFilters,
        ),
        this.repository.countActiveGoals(userId),
        this.reflectionService.countReflectionsForUserId(userId),
      ]).catch((error: unknown) => {
        throw this.toContextBuilderError(error);
      });

    return {
      activeGoals: {
        available: activeGoalAvailableCount,
        items: activeGoalItems,
      },
      recentMessages: {
        available: recentMessageAvailableCount,
        items: recentMessageItems,
      },
      recentReflections: {
        available: recentReflectionAvailableCount,
        items: recentReflectionItems,
      },
      relevantMemories: {
        available: relevantMemoryAvailableCount,
        items: relevantMemoryItems,
      },
    };
  }

  private assertCanBuildContextForUser(
    userAuthUserId: string,
    authContext: BuildMentorContextAuthContext,
  ) {
    if (authContext.authUserId && authContext.authUserId !== userAuthUserId) {
      throw new ContextBuilderServiceError("Forbidden.", 403);
    }
  }

  private toContextBuilderError(error: unknown) {
    if (error instanceof ReflectionServiceError) {
      return new ContextBuilderServiceError(error.message, error.statusCode);
    }

    return error;
  }
}

function buildEnvironmentContext(): MentorContextEnvironment {
  const now = new Date();

  return {
    currentDate: formatDate(now),
    currentDateTimeIso: now.toISOString(),
    currentTime: formatTime(now),
    timezone: getServerTimezoneLabel(),
  };
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(date: Date) {
  return date.toTimeString().slice(0, 8);
}

function getServerTimezoneLabel() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "server local time";
  } catch {
    return "server local time";
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

interface ContextBudgetState {
  currentMessage: string | null;
  recentMessages: MentorContextMessage[];
  recentReflections: MentorContextReflection[];
  relevantMemories: MentorContextMemory[];
  userGoals: MentorContextGoal[];
}

interface ContextBudgetResult extends ContextBudgetState {
  wasTrimmed: boolean;
}

function trimContextToBudget(
  input: ContextBudgetState,
  contextBudgetTokens: number,
): ContextBudgetResult {
  const result: ContextBudgetResult = {
    currentMessage: input.currentMessage,
    recentMessages: [...input.recentMessages],
    recentReflections: [...input.recentReflections],
    relevantMemories: [...input.relevantMemories],
    userGoals: [...input.userGoals],
    wasTrimmed: false,
  };

  while (estimateContextTokens(result) > contextBudgetTokens) {
    if (result.recentReflections.length > 0) {
      result.recentReflections.pop();
    } else if (result.relevantMemories.length > 0) {
      result.relevantMemories.pop();
    } else if (result.recentMessages.length > 0) {
      result.recentMessages.shift();
    } else if (result.userGoals.length > 0) {
      result.userGoals.pop();
    } else {
      break;
    }

    result.wasTrimmed = true;
  }

  return result;
}

function estimateContextTokens(input: ContextBudgetState) {
  const currentMessageTokens = estimateTextTokens(input.currentMessage ?? "");
  const recentMessageTokens = input.recentMessages.reduce(
    (total, message) =>
      total +
      estimateTextTokens(`${message.role} ${message.createdAt} ${message.content}`),
    0,
  );
  const memoryTokens = input.relevantMemories.reduce(
    (total, memory) =>
      total +
      estimateTextTokens(`${memory.category} ${memory.title} ${memory.content}`),
    0,
  );
  const goalTokens = input.userGoals.reduce(
    (total, goal) =>
      total + estimateTextTokens(`${goal.title} ${goal.description ?? ""}`),
    0,
  );
  const reflectionTokens = input.recentReflections.reduce(
    (total, reflection) => total + estimateTextTokens(reflection.summary),
    0,
  );

  return (
    currentMessageTokens +
    recentMessageTokens +
    memoryTokens +
    goalTokens +
    reflectionTokens
  );
}

function estimateTextTokens(text: string) {
  return Math.ceil(text.length / 4);
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
