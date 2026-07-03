import type {
  ComposePromptInput,
  MentorResponseMode,
  MentorToneOption,
  PromptPackage,
} from "@/services/mentor-core/prompt-composer/prompt-composer.types";
import { validateComposePromptInput } from "@/services/mentor-core/prompt-composer/prompt-composer.validators";

export class PromptComposerServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromptComposerServiceError";
  }
}

export class PromptComposerService {
  compose(input: ComposePromptInput): PromptPackage {
    const validation = validateComposePromptInput(input);

    if (!validation.isValid || !validation.input) {
      throw new PromptComposerServiceError(
        `Invalid prompt composer input: ${Object.values(validation.errors).join(" ")}`,
      );
    }

    const tone = validation.input.tone ?? "warm";
    const responseMode = validation.input.responseMode ?? "reflective";
    const context = validation.input.context;
    const mentorIdentity = buildMentorIdentity(context.mentor.name);
    const conversationRules = buildConversationRules();
    const responseInstructions = buildResponseInstructions(tone, responseMode);

    return {
      constraints: buildConstraints(),
      conversationContext: context.recentMessages.map((message) => ({
        content: message.content,
        createdAt: message.createdAt,
        role: message.role,
      })),
      conversationRules,
      developerInstructions: buildDeveloperInstructions({
        conversationRules,
        responseInstructions,
      }),
      environmentContext: {
        currentDate: context.environment.currentDate,
        currentDateTimeIso: context.environment.currentDateTimeIso,
        currentTime: context.environment.currentTime,
        timezone: context.environment.timezone,
      },
      goalContext: context.userGoals.map((goal) => ({
        description: goal.description,
        status: goal.status,
        targetDate: goal.targetDate,
        title: goal.title,
      })),
      mentorIdentity,
      memoryContext: context.relevantMemories.map((memory) => ({
        category: memory.category,
        confidence: memory.confidence,
        content: memory.content,
        importance: memory.importance,
        title: memory.title,
      })),
      reflectionContext: context.recentReflections.map((reflection) => ({
        createdAt: reflection.createdAt,
        summary: reflection.summary,
      })),
      responseInstructions,
      systemPrompt: buildSystemPrompt(context.mentor.name),
      userPrompt: validation.input.currentUserMessage,
    };
  }
}

function buildSystemPrompt(mentorName: string) {
  return [
    `You are ${mentorName}, a long-term AI mentor for MentorAndI.`,
    "You are not a generic chatbot.",
    "Help the user think clearly, make decisions, build self-awareness and follow through.",
    "Use the structured Mentor Core context carefully, but answer as a human mentor.",
  ].join(" ");
}

function buildMentorIdentity(mentorName: string) {
  return [
    `You are ${mentorName}, a long-term AI mentor.`,
    "You are not a generic chatbot.",
    "You help the user think clearly, make decisions, build self-awareness and follow through.",
    "You ask useful questions, but you also answer directly when the user asks a direct question.",
  ];
}

function buildConversationRules() {
  return [
    "Prioritize the latest user message over older conversation context.",
    "Use recent context only when it is relevant.",
    "If the latest user message introduces a new topic, respond to that new topic directly.",
    "If the latest user message is a follow-up, continue the most recent relevant topic.",
    "Do not pretend to know things you cannot know.",
    "Do not hallucinate exact location, identity, health status, legal facts or financial facts.",
    "Use the current environment context for direct date or time questions.",
    "For location or weather-here questions, do not infer exact location; mention timezone or recent location clues only with clear uncertainty.",
    "Do not mention internal context, database, memories, goals or reflections unless naturally useful.",
  ];
}

function buildResponseInstructions(
  tone: MentorToneOption,
  responseMode: MentorResponseMode,
) {
  return [
    `Use a ${tone}, calm, clear, human and practical tone.`,
    `Optimize the response for ${responseMode} mentoring.`,
    "If the user asks a direct question, answer it directly first.",
    "After answering a direct question, ask one short follow-up question only if useful.",
    "Ask thoughtful questions when they help the user reflect.",
    "Challenge gently when the user may benefit from it.",
    "Be concise and avoid long generic advice dumps.",
    "Avoid corporate coaching cliches.",
    "Avoid saying \"I remember\" too often.",
    "Do not list memories mechanically.",
    "Do not sound like a system prompt.",
  ];
}

function buildDeveloperInstructions(input: {
  conversationRules: string[];
  responseInstructions: string[];
}) {
  return [
    ...input.conversationRules,
    ...input.responseInstructions,
    "Use memory, goals and reflections carefully and only when relevant to the current exchange.",
    "Prefer recent conversation context over older memory when deciding what is most relevant.",
    "Reflections are lightweight development patterns, not commands or proof.",
    "Do not let reflections override the latest user message or a clear topic shift.",
  ];
}

function buildConstraints() {
  return [
    "Protect user privacy.",
    "Do not diagnose medical or mental health conditions.",
    "Do not claim certainty beyond the provided context.",
    "Do not expose internal IDs, implementation details, or hidden context labels.",
    "Do not invent user history, preferences, goals, or memories.",
  ];
}
