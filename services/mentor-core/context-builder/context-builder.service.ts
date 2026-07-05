import { ContextBuilderRepository } from "@/services/mentor-core/context-builder/context-builder.repository";
import { getLlmCostControls } from "@/services/llm/llm-cost-controls";
import { MemoryService } from "@/services/memory/memory.service";
import { MentorExpertiseService } from "@/services/mentor-expertise/expertise-service";
import { MentorMethodService } from "@/services/mentor-methods/method-service";
import { MentorSourceService } from "@/services/mentor-sources/source-service";
import {
  ReflectionService,
  ReflectionServiceError,
} from "@/services/reflection/reflection.service";
import type {
  BuildMentorContextAuthContext,
  BuildMentorContextInput,
  MentorContextEnvironment,
  MentorContextExpertise,
  MentorContextGoal,
  MentorContextMethod,
  MentorContextMemory,
  MentorContextMessage,
  MentorContextReflection,
  MentorContextSourceCard,
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
    private readonly methodService = new MentorMethodService(),
    private readonly expertiseService = new MentorExpertiseService(),
    private readonly sourceService = new MentorSourceService(),
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
    const relevantMethods = this.methodService.findRelevantMethods({
      currentMessage: input.currentMessage,
      limit: 2,
      recentContext: contextMessages.map((message) => message.content),
    });
    const contextMethods = relevantMethods.map(toContextMethod);
    const relevantExpertise = this.expertiseService.findRelevantExpertise({
      currentMessage: input.currentMessage,
      limit: 2,
      matchedMethodTitles: contextMethods.map((method) => method.title),
      recentContext: contextMessages.map((message) => message.content),
    });
    let contextExpertise = relevantExpertise.map(toContextExpertise);
    const expertiseAvailable = contextExpertise.length;
    const relevantSourceCards = this.sourceService.findRelevantSourceCards({
      currentMessage: input.currentMessage,
      limit: 2,
      matchedExpertiseTitles: contextExpertise.map(
        (expertise) => expertise.title,
      ),
      matchedMethodTitles: contextMethods.map((method) => method.title),
      recentContext: contextMessages.map((message) => message.content),
    });
    let contextSourceCards = relevantSourceCards.map(toContextSourceCard);
    const sourceCardsAvailable = contextSourceCards.length;
    const controls = getLlmCostControls();
    const budgetResult = trimContextToBudget(
      {
        currentMessage: input.currentMessage ?? null,
        relevantExpertise: contextExpertise,
        relevantMethods: contextMethods,
        relevantSourceCards: contextSourceCards,
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
    contextExpertise = budgetResult.relevantExpertise;
    contextSourceCards = budgetResult.relevantSourceCards;

    const environment = buildEnvironmentContext();
    const contextWasTrimmed =
      budgetResult.wasTrimmed ||
      recentMessages.available > contextMessages.length ||
      expertiseAvailable > contextExpertise.length ||
      sourceCardsAvailable > contextSourceCards.length ||
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
        expertise: {
          available: expertiseAvailable,
          included: contextExpertise.length,
          limit: 2,
        },
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
        methods: {
          available: contextMethods.length,
          included: contextMethods.length,
          limit: 2,
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
        sources: {
          available: sourceCardsAvailable,
          included: contextSourceCards.length,
          limit: 2,
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
        relevantMethodCount: contextMethods.length,
        relevantExpertiseCount: contextExpertise.length,
        relevantMemoryCount: contextMemories.length,
        relevantSourceCount: contextSourceCards.length,
        recentReflectionCount: contextReflections.length,
      }),
      relevantExpertise: contextExpertise,
      relevantMethods: contextMethods,
      relevantMemories: contextMemories,
      relevantSourceCards: contextSourceCards,
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

function toContextMethod(method: MentorContextMethod): MentorContextMethod {
  return {
    domain: method.domain,
    exampleQuestion: method.exampleQuestion,
    id: method.id,
    mentorInstruction: method.mentorInstruction,
    shortDescription: method.shortDescription,
    tags: method.tags,
    title: method.title,
    whenToUse: method.whenToUse,
  };
}

function toContextExpertise(
  expertise: MentorContextExpertise,
): MentorContextExpertise {
  return {
    commonUserProblems: expertise.commonUserProblems,
    coreSkills: expertise.coreSkills,
    description: expertise.description,
    id: expertise.id,
    mentorDomain: expertise.mentorDomain,
    recommendedTone: expertise.recommendedTone,
    relevantMethods: expertise.relevantMethods,
    riskNotes: expertise.riskNotes,
    sourceNotes: expertise.sourceNotes.map((sourceNote) => ({
      lastReviewed: sourceNote.lastReviewed,
      reliabilityNote: sourceNote.reliabilityNote,
      sourceType: sourceNote.sourceType,
      summary: sourceNote.summary,
      tags: sourceNote.tags,
      title: sourceNote.title,
      url: sourceNote.url,
    })),
    title: expertise.title,
  };
}

function toContextSourceCard(sourceCard: MentorContextSourceCard): MentorContextSourceCard {
  return {
    domain: sourceCard.domain,
    keyPrinciples: sourceCard.keyPrinciples,
    lastReviewed: sourceCard.lastReviewed,
    reliabilityNote: sourceCard.reliabilityNote,
    sourceType: sourceCard.sourceType,
    summary: sourceCard.summary,
    tags: sourceCard.tags,
    title: sourceCard.title,
    url: sourceCard.url,
    whenRelevant: sourceCard.whenRelevant,
  };
}

interface ContextBudgetState {
  currentMessage: string | null;
  relevantExpertise: MentorContextExpertise[];
  relevantMethods: MentorContextMethod[];
  relevantSourceCards: MentorContextSourceCard[];
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
    relevantExpertise: [...input.relevantExpertise],
    relevantMethods: [...input.relevantMethods],
    relevantSourceCards: [...input.relevantSourceCards],
    recentMessages: [...input.recentMessages],
    recentReflections: [...input.recentReflections],
    relevantMemories: [...input.relevantMemories],
    userGoals: [...input.userGoals],
    wasTrimmed: false,
  };

  while (estimateContextTokens(result) > contextBudgetTokens) {
    if (result.recentReflections.length > 0) {
      result.recentReflections.pop();
    } else if (result.relevantExpertise.length > 0) {
      result.relevantExpertise.pop();
    } else if (result.relevantSourceCards.length > 0) {
      result.relevantSourceCards.pop();
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
  const methodTokens = input.relevantMethods.reduce(
    (total, method) =>
      total +
      estimateTextTokens(
        `${method.domain} ${method.title} ${method.shortDescription} ${method.whenToUse} ${method.mentorInstruction}`,
      ),
    0,
  );
  const expertiseTokens = input.relevantExpertise.reduce(
    (total, expertise) =>
      total +
      estimateTextTokens(
        [
          expertise.mentorDomain,
          expertise.title,
          expertise.description,
          expertise.coreSkills.join(" "),
          expertise.commonUserProblems.join(" "),
          expertise.relevantMethods.join(" "),
          expertise.recommendedTone,
          expertise.riskNotes.join(" "),
          expertise.sourceNotes
            .map((sourceNote) =>
              [
                sourceNote.title,
                sourceNote.sourceType,
                sourceNote.summary,
                sourceNote.tags.join(" "),
                sourceNote.reliabilityNote,
              ].join(" "),
            )
            .join(" "),
        ].join(" "),
      ),
    0,
  );
  const sourceTokens = input.relevantSourceCards.reduce(
    (total, sourceCard) =>
      total +
      estimateTextTokens(
        [
          sourceCard.domain,
          sourceCard.title,
          sourceCard.sourceType,
          sourceCard.summary,
          sourceCard.tags.join(" "),
          sourceCard.keyPrinciples.join(" "),
          sourceCard.whenRelevant,
          sourceCard.reliabilityNote,
        ].join(" "),
      ),
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
    expertiseTokens +
    sourceTokens +
    methodTokens +
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
  relevantExpertiseCount: number;
  relevantMethodCount: number;
  relevantMemoryCount: number;
  relevantSourceCount: number;
  recentReflectionCount: number;
}): RecommendedMentorFocus {
  const priorities: string[] = [];

  if (input.currentMessage) {
    priorities.push("respond-to-current-user-message");
  }

  if (input.relevantMemoryCount > 0) {
    priorities.push("use-established-understanding-of-user");
  }

  if (input.relevantMethodCount > 0) {
    priorities.push("apply-relevant-mentor-methods-without-being-formulaic");
  }

  if (input.relevantExpertiseCount > 0) {
    priorities.push("apply-relevant-domain-expertise-with-current-message-first");
  }

  if (input.relevantSourceCount > 0) {
    priorities.push("use-curated-source-notes-without-implying-live-research");
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
