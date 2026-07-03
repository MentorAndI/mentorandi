import type { LlmProvider } from "@/services/llm/providers/provider.interface";
import type {
  LlmCompletionRequest,
  LlmCompletionResponse,
} from "@/services/llm/llm.types";
import type {
  MentorContextGoal,
  MentorContextEnvironment,
  MentorContextMemory,
  MentorContextMessage,
} from "@/services/mentor-core/context-builder/context-builder.types";

const defaultMockModel = "mock-deterministic-v1";

export class MockLlmProvider implements LlmProvider {
  readonly name = "mock";

  async complete(
    request: LlmCompletionRequest,
  ): Promise<LlmCompletionResponse> {
    const mentorName = request.context.mentor.name;
    const focus = request.context.recommendedMentorFocus.priorities.join(", ");
    const memories =
      request.context.memories.length > 0
        ? request.context.memories
        : request.context.relevantMemories;
    const relevantMemory = findRelevantMemory(request.userMessage, memories);
    const relevantGoal = findRelevantGoal(
      request.userMessage,
      request.context.goals,
    );

    return {
      content: buildCurrentMessageResponse({
        currentMessage: request.userMessage,
        environment: request.context.environment,
        focus,
        mentorName,
        recentMessages: request.context.recentMessages,
        relevantGoal,
        relevantMemory,
      }),
      metadata: {
        model: request.model ?? defaultMockModel,
        provider: this.name,
      },
    };
  }
}

interface CurrentMessageResponseInput {
  currentMessage: string;
  environment: MentorContextEnvironment;
  focus: string;
  mentorName: string;
  recentMessages: MentorContextMessage[];
  relevantGoal?: MentorContextGoal;
  relevantMemory?: MentorContextMemory;
}

type CurrentMessageKind =
  | "challenge"
  | "decision"
  | "direct-question"
  | "follow-up"
  | "intention"
  | "project-focus"
  | "project-update"
  | "reflection"
  | "time-date-question"
  | "travel-location"
  | "update";

function buildCurrentMessageResponse({
  currentMessage,
  environment,
  focus,
  mentorName,
  recentMessages,
  relevantGoal,
  relevantMemory,
}: CurrentMessageResponseInput) {
  const conversationState = getConversationState(recentMessages);
  const projectDesignContext = getProjectDesignContext(
    currentMessage,
    recentMessages,
  );
  const messageKind = classifyCurrentMessage(
    currentMessage,
    conversationState.previousMentorMessage,
    projectDesignContext,
  );

  if (messageKind === "time-date-question") {
    return buildTimeDateAnswer(currentMessage, environment);
  }

  const shouldUseStoredContext =
    messageKind !== "follow-up" &&
    messageKind !== "direct-question" &&
    messageKind !== "travel-location" &&
    !wasSimilarContextRecentlyUsed(recentMessages, relevantGoal, relevantMemory);
  const responseParts = [
    buildCurrentMessageAcknowledgement(
      messageKind,
      conversationState.previousMentorMessage,
    ),
    shouldUseStoredContext
      ? buildRelevantContextLine(relevantGoal, relevantMemory)
      : "",
    buildNextStepQuestion(
      messageKind,
      shouldUseStoredContext ? relevantGoal : undefined,
      shouldUseStoredContext ? relevantMemory : undefined,
      conversationState.previousUserMessage,
      projectDesignContext,
      currentMessage,
    ),
  ].filter(Boolean);

  if (responseParts.length > 0) {
    return responseParts.join(" ");
  }

  return `I'm here with you. ${mentorName} is focused on ${focus || "helping you find the next clear step"}. What would be useful to look at first?`;
}

function classifyCurrentMessage(
  message: string,
  previousMentorMessage?: MentorContextMessage,
  projectDesignContext?: ProjectDesignContext,
): CurrentMessageKind {
  const normalizedMessage = normalizeForMatching(message);

  if (hasTravelLocationSignal(normalizedMessage)) {
    return "travel-location";
  }

  if (isTimeDateQuestion(normalizedMessage)) {
    return "time-date-question";
  }

  if (
    projectDesignContext?.hasContext &&
    isProjectDesignFocusQuestion(normalizedMessage) &&
    !hasCompetingTopicShiftSignal(normalizedMessage)
  ) {
    return "project-focus";
  }

  if (previousMentorMessage && isFollowUpMessage(normalizedMessage)) {
    return "follow-up";
  }

  if (isProjectDesignUpdate(normalizedMessage)) {
    return "project-update";
  }

  if (
    /\b(struggle|struggling|stuck|hard|difficult|overwhelmed|confused|worried)\b/.test(
      normalizedMessage,
    )
  ) {
    return "challenge";
  }

  if (/\b(decide|decision|choose|whether|should i)\b/.test(normalizedMessage)) {
    return "decision";
  }

  if (/\b(i want|i need|trying to|my goal is)\b/.test(normalizedMessage)) {
    return "intention";
  }

  if (
    /\b(i|we)\s+(just\s+)?(finished|completed|did|made|started|sent|met|talked|tried|worked|changed|updated|decided)\b/.test(
      normalizedMessage,
    )
  ) {
    return "update";
  }

  if (isDirectQuestion(normalizedMessage)) {
    return "direct-question";
  }

  return "reflection";
}

function buildCurrentMessageAcknowledgement(
  kind: CurrentMessageKind,
  previousMentorMessage?: MentorContextMessage,
) {
  switch (kind) {
    case "challenge":
      return "That sounds like something worth slowing down around.";
    case "decision":
      return "That sounds like a decision that deserves a clear frame.";
    case "direct-question":
      return "Good question.";
    case "follow-up":
      return previousMentorMessage
        ? "Yes, let's stay with that thread."
        : "Yes, let's keep going.";
    case "intention":
      return "Good. Naming that clearly gives us something concrete to work with.";
    case "project-focus":
      return "Stay with the design.";
    case "project-update":
      return "Good. For the design, focus on one thing first.";
    case "reflection":
      return "I hear you.";
    case "time-date-question":
      return "";
    case "travel-location":
      return "Good question.";
    case "update":
      return "That is a useful update.";
  }
}

function buildRelevantContextLine(
  relevantGoal?: MentorContextGoal,
  relevantMemory?: MentorContextMemory,
) {
  if (relevantMemory) {
    return formatSubtleMemoryLine(relevantMemory);
  }

  if (relevantGoal) {
    return `It also connects with your goal of ${formatGoalReference(relevantGoal.title)}.`;
  }

  return "";
}

function buildNextStepQuestion(
  kind: CurrentMessageKind,
  relevantGoal?: MentorContextGoal,
  relevantMemory?: MentorContextMemory,
  previousUserMessage?: MentorContextMessage,
  projectDesignContext?: ProjectDesignContext,
  currentMessage?: string,
) {
  if (kind === "travel-location") {
    return buildTravelLocationGuidance(currentMessage ?? "");
  }

  if (kind === "direct-question") {
    return "I may need more context to answer that well, but let's start with the practical version: what outcome are you looking for?";
  }

  if (kind === "project-focus") {
    if (projectDesignContext?.mentionsMentorAndI) {
      return "The next thing to focus on is whether MentorAndI feels like a personal mentor before it tries to explain features.";
    }

    return "The next thing to focus on is whether the page makes the user feel understood before it tries to explain features.";
  }

  if (kind === "project-update") {
    if (relevantGoal || relevantMemory) {
      return "What is the one thing this next pass still needs to communicate more clearly?";
    }

    if (projectDesignContext?.mentionsMentorAndI) {
      return "Does it make MentorAndI feel like a personal mentor rather than another AI tool?";
    }

    return "Does it make the product feel human, clear and personal?";
  }

  if (kind === "challenge") {
    return "What is the smallest part of it that we can name honestly right now?";
  }

  if (kind === "decision") {
    return "What would make this choice feel clearer rather than just more urgent?";
  }

  if (kind === "follow-up") {
    if (previousUserMessage) {
      return "What part of that feels most important to clarify next?";
    }

    return "What would help you move one step further with it?";
  }

  if (kind === "intention") {
    return "What is one small step that would make this real today?";
  }

  if (kind === "update") {
    return "What changed after taking that step?";
  }

  return "What feels like the most useful place to begin?";
}

function buildTimeDateAnswer(
  currentMessage: string,
  environment: MentorContextEnvironment,
) {
  const normalizedMessage = normalizeForMatching(currentMessage);

  if (/\b(what day|day is it|today)\b/.test(normalizedMessage)) {
    const weekday = formatWeekday(environment.currentDateTimeIso);

    return `${weekday ? `Today is ${weekday}, ` : "Today is "}${environment.currentDate}. It is currently ${environment.currentTime} in ${environment.timezone}. If you want, I can also help you plan what to do next.`;
  }

  if (/\b(date|today s date|todays date)\b/.test(normalizedMessage)) {
    return `Today's date is ${environment.currentDate}. It is currently ${environment.currentTime} in ${environment.timezone}. If you want, I can also help you plan what to do next.`;
  }

  return `It is currently ${environment.currentTime} on ${environment.currentDate} in ${environment.timezone}. If you want, I can also help you plan what to do next.`;
}

function formatWeekday(currentDateTimeIso: string) {
  const date = new Date(currentDateTimeIso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function isTimeDateQuestion(normalizedMessage: string) {
  return /\b(what time is it|time is it|what date is it|what day is it|day is it today|today s date|todays date)\b/.test(
    normalizedMessage,
  );
}

function isDirectQuestion(normalizedMessage: string) {
  return /^(what|where|when|how|why|who|which|can|could|should|would|is|are|do|does|did)\b/.test(
    normalizedMessage,
  );
}

interface ProjectDesignContext {
  hasContext: boolean;
  mentionsMentorAndI: boolean;
}

function getProjectDesignContext(
  currentMessage: string,
  recentMessages: MentorContextMessage[],
): ProjectDesignContext {
  const currentText = normalizeForMatching(currentMessage);
  const recentUserText = recentMessages
    .filter((message) => message.role === "USER")
    .slice(-4)
    .map((message) => message.content)
    .join(" ");
  const combinedText = normalizeForMatching(`${currentMessage} ${recentUserText}`);

  return {
    hasContext:
      hasProjectDesignSignal(currentText) || hasProjectDesignSignal(combinedText),
    mentionsMentorAndI: /\bmentorandi\b/.test(combinedText),
  };
}

function isProjectDesignFocusQuestion(normalizedMessage: string) {
  return (
    /\b(what|where|which|how)\b/.test(normalizedMessage) &&
    /\b(should|next|focus|prioritize|improve|work on)\b/.test(normalizedMessage)
  );
}

function isProjectDesignUpdate(normalizedMessage: string) {
  return (
    hasProjectDesignSignal(normalizedMessage) &&
    /\b(finishing|working|building|designing|creating|developing|shipping|launched|launching|revising|improving|focus|focused|updating|making)\b/.test(
      normalizedMessage,
    )
  );
}

function hasProjectDesignSignal(normalizedText: string) {
  return /\b(mentorandi|project|design|website|product|ui|ux|user experience|interface|page|prototype)\b/.test(
    normalizedText,
  );
}

function hasTravelLocationSignal(normalizedText: string) {
  return /\b(where|places|visit|city|country|cyprus|paphos|restaurant|beach|museum|trip|travel|harbour|harbor|old town)\b/.test(
    normalizedText,
  );
}

function hasCompetingTopicShiftSignal(normalizedText: string) {
  return (
    hasTravelLocationSignal(normalizedText) ||
    /\b(health|doctor|medical|sleep|exercise|workout|diet|anxiety|stress|pain|symptom|therapy|relationship|family|friend|partner|money|budget|tax|taxes|career|job|interview)\b/.test(
      normalizedText,
    )
  );
}

function buildTravelLocationGuidance(currentMessage: string) {
  const normalizedMessage = normalizeForMatching(currentMessage);

  if (/\bpaphos\b/.test(normalizedMessage)) {
    return "If you're in Paphos, start with places that give you a mix of history, sea and calm: the harbour, the Tombs of the Kings, the archaeological park and a walk near the old town. What kind of place are you looking for today: relaxing, historic or social?";
  }

  if (/\bcyprus\b/.test(normalizedMessage)) {
    return "For Cyprus, choose one place for history, one for the sea and one for an unhurried walk. Are you looking for something relaxing, historic or social today?";
  }

  if (/\brestaurant\b/.test(normalizedMessage)) {
    return "For a restaurant, start by choosing the mood first: quiet, local, seaside or lively. What kind of evening do you want it to support?";
  }

  if (/\bbeach\b/.test(normalizedMessage)) {
    return "For a beach, decide whether you want calm water, space to think or somewhere more social. Which of those would fit today?";
  }

  return "Start with the kind of experience you want: calm, historic, social or restorative. Which one would make today feel better?";
}

function getConversationState(recentMessages: MentorContextMessage[]) {
  const priorMessages = recentMessages.slice(0, -1);
  const previousMentorMessage = [...priorMessages]
    .reverse()
    .find((message) => message.role === "MENTOR");
  const previousUserMessage = [...priorMessages]
    .reverse()
    .find((message) => message.role === "USER");

  return {
    previousMentorMessage,
    previousUserMessage,
  };
}

function isFollowUpMessage(normalizedMessage: string) {
  const wordCount = normalizedMessage.split(" ").filter(Boolean).length;

  if (wordCount <= 5) {
    return /\b(yes|yeah|okay|ok|that|this|it|why|how|what|more)\b/.test(
      normalizedMessage,
    );
  }

  return /\b(what about|how about|can you explain|tell me more|go deeper|why is that|what do you mean|and then|next step)\b/.test(
    normalizedMessage,
  );
}

function wasSimilarContextRecentlyUsed(
  recentMessages: MentorContextMessage[],
  relevantGoal?: MentorContextGoal,
  relevantMemory?: MentorContextMemory,
) {
  const lastMentorMessage = [...recentMessages]
    .reverse()
    .find((message) => message.role === "MENTOR");

  if (!lastMentorMessage) {
    return false;
  }

  const lastMentorTerms = getSignalTerms(lastMentorMessage.content);
  const contextTerms = getSignalTerms(
    `${relevantGoal?.title ?? ""} ${relevantMemory?.title ?? ""} ${relevantMemory?.content ?? ""}`,
  );

  if (contextTerms.size === 0) {
    return false;
  }

  return Array.from(contextTerms).some((term) => lastMentorTerms.has(term));
}

function formatSubtleMemoryLine(memory: MentorContextMemory) {
  const content = normalizeMemoryContent(memory.content);

  switch (memory.category) {
    case "CHALLENGE":
      return `It may also touch the challenge you've named around ${content}.`;
    case "GOAL":
    case "PROJECT":
      return `That connects with the work you've been moving toward: ${normalizeGoalContent(content)}.`;
    case "PREFERENCE":
      return `That fits with your preference for ${content}.`;
    case "VALUE":
      return `That fits with how much you value ${content}.`;
    default:
      return "";
  }
}

function formatGoalReference(title: string) {
  const normalizedTitle = trimTrailingPunctuation(title)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^to\s+/i, "");

  return gerundifyLeadingVerb(normalizedTitle);
}

function gerundifyLeadingVerb(phrase: string) {
  if (!phrase) {
    return phrase;
  }

  const [firstWord = "", ...remainingWords] = phrase.split(" ");

  if (firstWord.endsWith("ing")) {
    return phrase;
  }

  const gerund = leadingGoalVerbGerunds[firstWord];

  if (!gerund) {
    return phrase;
  }

  return [gerund, ...remainingWords].join(" ");
}

const leadingGoalVerbGerunds: Record<string, string> = {
  achieve: "achieving",
  be: "being",
  become: "becoming",
  build: "building",
  create: "creating",
  develop: "developing",
  feel: "feeling",
  find: "finding",
  get: "getting",
  grow: "growing",
  improve: "improving",
  learn: "learning",
  live: "living",
  make: "making",
  manage: "managing",
  organize: "organizing",
  practice: "practicing",
  pursue: "pursuing",
  reduce: "reducing",
  start: "starting",
  stay: "staying",
  stop: "stopping",
  strengthen: "strengthening",
  think: "thinking",
  understand: "understanding",
};

function normalizeMemoryContent(content: string) {
  return trimTrailingPunctuation(content)
    .replace(/^user\s+wants\s+/i, "")
    .replace(/^user\s+needs\s+/i, "")
    .replace(/^user\s+is\s+trying\s+to\s+/i, "")
    .replace(/^user\s+values\s+/i, "")
    .replace(/^user\s+prefers\s+/i, "")
    .replace(/^user\s+likes\s+/i, "")
    .replace(/^user\s+doesn't\s+like\s+/i, "")
    .replace(/^user\s+struggles\s+with\s+/i, "")
    .replace(/^user\s+struggles\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeGoalContent(content: string) {
  const normalizedContent = content.trim();

  if (/^help\s+\w+ing\b/i.test(normalizedContent)) {
    return `getting ${normalizedContent}`;
  }

  return normalizedContent
    .replace(/^help\s+/i, "getting help with ")
    .replace(/^to\s+to\s+/i, "to ");
}

function trimTrailingPunctuation(value: string) {
  return value.replace(/[.!?]+$/g, "");
}

function findRelevantGoal(
  currentMessage: string,
  goals: MentorContextGoal[],
) {
  const currentTerms = getSignalTerms(currentMessage);

  return goals.find((goal) =>
    hasRelevantOverlap(currentTerms, `${goal.title} ${goal.description ?? ""}`),
  );
}

function findRelevantMemory(
  currentMessage: string,
  memories: MentorContextMemory[],
) {
  const currentTerms = getSignalTerms(currentMessage);

  return memories.find((memory) =>
    isMemoryCategoryWorthReferencing(memory.category) &&
    hasRelevantOverlap(currentTerms, `${memory.title} ${memory.content}`),
  );
}

function isMemoryCategoryWorthReferencing(category: string) {
  return ["CHALLENGE", "GOAL", "PREFERENCE", "PROJECT", "VALUE"].includes(
    category,
  );
}

function hasRelevantOverlap(currentTerms: Set<string>, context: string) {
  if (currentTerms.size === 0) {
    return false;
  }

  const contextTerms = getSignalTerms(context);

  return Array.from(currentTerms).some((term) => contextTerms.has(term));
}

function getSignalTerms(value: string) {
  return new Set(
    normalizeForMatching(value)
      .split(" ")
      .map((term) => term.trim())
      .filter((term) => term.length >= 5 && !genericSignalTerms.has(term)),
  );
}

function normalizeForMatching(value: string) {
  return value
    .toLowerCase()
    .replace(/mentor\s+and\s+i/g, "mentorandi")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const genericSignalTerms = new Set([
  "about",
  "again",
  "clear",
  "going",
  "maybe",
  "really",
  "right",
  "something",
  "still",
  "thing",
  "think",
  "today",
  "would",
]);
