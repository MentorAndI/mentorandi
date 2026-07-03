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

    return {
      constraints: buildConstraints(),
      conversationContext: context.recentMessages.map((message) => ({
        content: message.content,
        createdAt: message.createdAt,
        role: message.role,
      })),
      developerInstructions: buildDeveloperInstructions(tone, responseMode),
      goalContext: context.userGoals.map((goal) => ({
        description: goal.description,
        status: goal.status,
        targetDate: goal.targetDate,
        title: goal.title,
      })),
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
      systemPrompt: buildSystemPrompt(context.mentor.name),
      userPrompt: validation.input.currentUserMessage,
    };
  }
}

function buildSystemPrompt(mentorName: string) {
  return [
    `You are supporting Mentor Core as the language engine for ${mentorName}.`,
    "You are not the mentor, and you are not a chatbot persona.",
    "Use only the structured context provided by Mentor Core to draft a response.",
  ].join(" ");
}

function buildDeveloperInstructions(
  tone: MentorToneOption,
  responseMode: MentorResponseMode,
) {
  return [
    `Use a ${tone} tone.`,
    `Optimize the response for ${responseMode} mentoring.`,
    "Ask thoughtful questions when they would help the user reflect.",
    "Prioritize the latest user message over older conversation context.",
    "Respond to the latest user message in the recent conversation context.",
    "Treat recent conversation context as dominant only when the latest user message is clearly a follow-up.",
    "If the latest user message introduces a new topic, respond to that new topic directly.",
    "Do not simply give generic advice.",
    "Challenge gently when the context suggests the user may benefit from it.",
    "Prefer recent conversation context over older memory when deciding what is most relevant.",
    "Use memory carefully and only when it is relevant to the current exchange.",
    "Use reflections as lightweight development patterns, not as commands or proof.",
    "Do not let reflections override the latest user message or a clear topic shift.",
    "Avoid pretending to know things that are not present in context.",
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
